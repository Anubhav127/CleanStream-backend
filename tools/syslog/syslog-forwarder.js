// Syslog forwarder — tails audit.log, wraps each JSON line in an RFC 3164
// syslog frame, and ships it to Wazuh over UDP or TCP.
//
//     npm run forward           # protocol from SYSLOG_PROTOCOL (.env), default udp
//     npm run forward:udp       # force UDP
//     npm run forward:tcp       # force TCP
//     node tools/syslog/syslog-forwarder.js --tcp --host=10.0.0.5 --port=514
//
// CLI flags override .env: --udp | --tcp | --protocol=udp|tcp | --host=... |
//                          --port=... | --file=... | --from-start
//
// Stop with Ctrl+C.

import fs from 'node:fs';
import net from 'node:net';
import dgram from 'node:dgram';
import path from 'node:path';
import config from './config.js';

// ---------------------------------------------------------------------------
// Resolve settings: .env (via config) with CLI overrides on top.
// ---------------------------------------------------------------------------

function parseArgs(argv) {
    const out = {};
    for (const arg of argv.slice(2)) {
        if (arg === '--tcp') out.protocol = 'tcp';
        else if (arg === '--udp') out.protocol = 'udp';
        else if (arg === '--from-start') out.fromStart = true;
        else if (arg.startsWith('--protocol=')) out.protocol = arg.slice(11).toLowerCase();
        else if (arg.startsWith('--host=')) out.host = arg.slice(7);
        else if (arg.startsWith('--port=')) out.port = Number(arg.slice(7));
        else if (arg.startsWith('--file=')) out.file = arg.slice(7);
    }
    return out;
}

const cli = parseArgs(process.argv);

const protocol = cli.protocol || config.syslog.protocol;
const host = cli.host || config.syslog.host;
const port = cli.port || config.syslog.port;
const file = cli.file ? path.resolve(cli.file) : config.auditLogPath;
const fromStart = cli.fromStart || config.tailFromStart;
const { hostname, appName, facility } = config.syslog;

if (!['udp', 'tcp'].includes(protocol)) {
    console.error(`[forwarder] invalid protocol "${protocol}" — use udp or tcp`);
    process.exit(1);
}

// ---------------------------------------------------------------------------
// RFC 3164 framing: <PRI>TIMESTAMP HOSTNAME TAG: MESSAGE
// PRI = facility * 8 + severity.  Severity is derived from the JSON "level".
// ---------------------------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SEVERITY = {
    emerg: 0, alert: 1, crit: 2, error: 3, err: 3,
    warn: 4, warning: 4, notice: 5, info: 6, debug: 7,
};

function severityFromLevel(level) {
    const s = SEVERITY[String(level || '').toLowerCase()];
    return s === undefined ? 6 : s; // default to "info"
}

// RFC 3164 timestamp: "Mmm d HH:MM:SS", day space-padded to width 2, local time.
function rfc3164Timestamp(d = new Date()) {
    const month = MONTHS[d.getMonth()];
    const day = String(d.getDate()).padStart(2, ' ');
    const time = [d.getHours(), d.getMinutes(), d.getSeconds()]
        .map((n) => String(n).padStart(2, '0'))
        .join(':');
    return `${month} ${day} ${time}`;
}

function buildSyslog(line) {
    let severity = 6;
    try {
        severity = severityFromLevel(JSON.parse(line).level);
    } catch {
        // Not JSON (or malformed) — keep default "info" and forward as-is.
    }
    const pri = facility * 8 + severity;
    return `<${pri}>${rfc3164Timestamp()} ${hostname} ${appName}: ${line}`;
}

// ---------------------------------------------------------------------------
// Transport senders. Both expose { send(message), close() }.
// UDP: one datagram per message.  TCP: newline-delimited stream (RFC 6587
// non-transparent framing), with buffering + auto-reconnect.
// ---------------------------------------------------------------------------

function createUdpSender(destHost, destPort) {
    const socket = dgram.createSocket('udp4');
    socket.on('error', (err) => console.error('[udp] socket error:', err.message));
    return {
        send(message) {
            socket.send(Buffer.from(message), destPort, destHost, (err) => {
                if (err) console.error('[udp] send error:', err.message);
            });
        },
        close() {
            socket.close();
        },
    };
}

function createTcpSender(destHost, destPort) {
    let socket = null;
    let connected = false;
    let closing = false;
    let reconnectTimer = null;
    const queue = []; // messages waiting for a live connection

    function flush() {
        while (connected && queue.length) socket.write(queue.shift());
    }

    function connect() {
        socket = net.createConnection({ host: destHost, port: destPort }, () => {
            connected = true;
            console.log(`[tcp] connected to ${destHost}:${destPort}`);
            flush();
        });
        socket.on('error', (err) => console.error('[tcp] socket error:', err.message));
        socket.on('close', () => {
            connected = false;
            if (closing || reconnectTimer) return;
            console.error('[tcp] disconnected — reconnecting in 2s');
            reconnectTimer = setTimeout(() => {
                reconnectTimer = null;
                connect();
            }, 2000);
        });
    }

    connect();

    return {
        send(message) {
            const framed = message + '\n';
            if (connected) socket.write(framed);
            else queue.push(framed); // hold until (re)connected
        },
        close() {
            closing = true;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            if (socket) socket.end();
        },
    };
}

// ---------------------------------------------------------------------------
// Tailer — follows a file for appended lines, like `tail -f`. Uses fs.watchFile
// (polling) for cross-platform reliability, especially on Windows. Handles the
// file not existing yet and truncation/rotation (size shrinks -> restart at 0).
// ---------------------------------------------------------------------------

function tailFile(filePath, pollMs, replayFromStart, onLine) {
    let position = 0;
    let leftover = '';
    let busy = false; // prevents overlapping reads from double-sending

    function readNew() {
        if (busy) return;
        busy = true;

        fs.stat(filePath, (err, stat) => {
            if (err) {
                busy = false; // file may not exist yet — try again next poll
                return;
            }
            if (stat.size < position) {
                // Truncated or rotated — start over from the top.
                position = 0;
                leftover = '';
            }
            if (stat.size <= position) {
                busy = false; // nothing new
                return;
            }

            const stream = fs.createReadStream(filePath, {
                start: position,
                end: stat.size - 1, // inclusive
                encoding: 'utf8',
            });

            let chunk = '';
            stream.on('data', (d) => {
                chunk += d;
            });
            stream.on('end', () => {
                position = stat.size;
                const lines = (leftover + chunk).split('\n');
                leftover = lines.pop(); // last element is a partial line (or '')
                for (const raw of lines) {
                    const line = raw.replace(/\r$/, '').trim();
                    if (line) onLine(line);
                }
                busy = false;
            });
            stream.on('error', (e) => {
                console.error('[tail] read error:', e.message);
                busy = false;
            });
        });
    }

    function start() {
        fs.stat(filePath, (err, stat) => {
            // Start at end (tail -f) unless replaying the whole file.
            position = replayFromStart || err ? 0 : stat.size;
            fs.watchFile(filePath, { interval: pollMs }, () => readNew());
            console.log(`[tail] following ${filePath} (from byte ${position})`);
            readNew(); // pick up anything already past `position`
        });
    }

    function stop() {
        fs.unwatchFile(filePath);
    }

    return { start, stop };
}

// ---------------------------------------------------------------------------
// Wire it all together.
// ---------------------------------------------------------------------------

console.log(`[forwarder] protocol=${protocol} -> ${host}:${port}`);
console.log(
    `[forwarder] tailing ${file} | RFC 3164 | tag=${appName} facility=${facility} host=${hostname}`
);

const sender = protocol === 'tcp' ? createTcpSender(host, port) : createUdpSender(host, port);

const tail = tailFile(file, config.tailPollMs, fromStart, (line) => {
    const message = buildSyslog(line);
    sender.send(message);
    console.log(`[forwarder] -> ${message}`);
});
tail.start();

function shutdown() {
    console.log('\n[forwarder] shutting down…');
    tail.stop();
    sender.close();
    setTimeout(() => process.exit(0), 200);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
 