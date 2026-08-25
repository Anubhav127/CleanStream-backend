// Log generator — appends one JSON audit event to audit.log on an interval.
//
// This stands in for whatever really writes your audit trail. The forwarder
// tails this file and ships each new line to Wazuh. Run it in its own terminal:
//
//     npm run audit:gen
//
// Stop with Ctrl+C.

import fs from 'node:fs';
import path from 'node:path';
import config from './config.js';

const { auditLogPath, generatorIntervalMs } = config;

// Make sure the target directory (e.g. logs/) exists.
fs.mkdirSync(path.dirname(auditLogPath), { recursive: true });

// Append-mode stream: each write adds one line, never truncates.
const stream = fs.createWriteStream(auditLogPath, { flags: 'a' });

// A little variety so the SIEM sees a mix of severities and actions.
const SAMPLE_EVENTS = [
    { level: 'info', action: 'user.login', outcome: 'success' },
    { level: 'info', action: 'post.create', outcome: 'success' },
    { level: 'warn', action: 'auth.rate_limited', outcome: 'blocked' },
    { level: 'error', action: 'user.login', outcome: 'failure' },
    { level: 'info', action: 'post.moderated', outcome: 'approved' },
];

let seq = 0;

const randomIp = () =>
    `10.0.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;

function writeEntry() {
    const base = SAMPLE_EVENTS[seq % SAMPLE_EVENTS.length];
    const entry = {
        ...base,
        ts: new Date().toISOString(),
        seq: ++seq,
        userId: `u_${1000 + (seq % 50)}`,
        ip: randomIp(),
        service: 'cleanstream-backend',
    };

    // One JSON object per line (newline-delimited JSON) — this is what the
    // forwarder splits on.
    stream.write(JSON.stringify(entry) + '\n');
    console.log(`[generator] wrote #${seq}: ${entry.action} (${entry.outcome})`);
}

console.log(
    `[generator] appending a JSON line to ${auditLogPath} every ${generatorIntervalMs} ms`
);

// Write one immediately so there's data without waiting a full interval.
writeEntry();
const timer = setInterval(writeEntry, generatorIntervalMs);

function shutdown() {
    clearInterval(timer);
    stream.end(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
