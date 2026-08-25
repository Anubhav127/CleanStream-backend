// Standalone config for the syslog-forwarding POC.
//
// This is intentionally NOT wired to src/shared/config/env.js — that module
// enforces a strict Zod schema and process.exit(1)s on any missing app var.
// These tools are a self-contained experiment, so they read only their own
// vars from .env (via dotenv) and fall back to sane defaults.

import 'dotenv/config';
import os from 'node:os';
import path from 'node:path';

const num = (value, fallback) =>
    value === undefined || value === '' ? fallback : Number(value);

const bool = (value, fallback) =>
    value === undefined || value === '' ? fallback : /^(1|true|yes)$/i.test(value);

const config = {
    // File the generator appends to and the forwarder tails.
    auditLogPath: path.resolve(process.env.AUDIT_LOG_PATH || 'logs/audit.log'),

    // How often the generator writes a new JSON line.
generatorIntervalMs: num(process.env.AUDIT_GEN_INTERVAL_MS, 50),

    // fs.watchFile poll interval — polling is the most reliable "tail -f" on Windows.
    tailPollMs: num(process.env.TAIL_POLL_MS, 1000),

    // false = behave like `tail -f` (only lines appended after startup).
    // true  = replay the whole file from byte 0 (handy for testing).
    tailFromStart: bool(process.env.TAIL_FROM_START, false),

    // Syslog destination = your Wazuh manager's syslog remote.
    syslog: {
        protocol: (process.env.SYSLOG_PROTOCOL || 'udp').toLowerCase(),
        host: process.env.SYSLOG_HOST || '192.168.0.200',
        port: num(process.env.SYSLOG_PORT, 514),

        // RFC 3164 header fields.
        hostname: process.env.SYSLOG_HOSTNAME || os.hostname(),
        appName: process.env.SYSLOG_APP_NAME || 'cleanstream-audit',
        facility: num(process.env.SYSLOG_FACILITY, 16), // 16 = local0
    },
};

export default config;
