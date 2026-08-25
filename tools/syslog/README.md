# Syslog forwarding POC

A tiny, dependency-free experiment to see how log → syslog → Wazuh forwarding
works. Two moving parts:

| Script                | Role                                                                 |
| --------------------- | ------------------------------------------------------------------- |
| `log-generator.js`    | Appends one JSON audit event to `logs/audit.log` every 5s.          |
| `syslog-forwarder.js` | Tails `audit.log`, wraps each line in **RFC 3164** syslog, sends it. |

It is fully decoupled from the app (`src/`) — nothing here imports the Winston
logger or the strict env schema.

## Quick start

Two terminals:

```bash
# Terminal 1 — produce audit lines
npm run audit:gen

# Terminal 2 — forward them to Wazuh
npm run forward:udp      # or: npm run forward:tcp
```

You'll see the forwarder print each framed message it sends:

```
[forwarder] -> <134>Aug  8 12:00:00 cleanstream cleanstream-audit: {"level":"info","action":"user.login",...}
```

`<134>` = facility 16 (local0) × 8 + severity 6 (info). The forwarder maps the
JSON `level` field to syslog severity (`error`→3, `warn`→4, `info`→6, `debug`→7).

## Configuration

Set these in `.env` (all optional — defaults shown):

| Variable                | Default           | Meaning                                    |
| ----------------------- | ----------------- | ------------------------------------------ |
| `SYSLOG_HOST`           | `127.0.0.1`       | Wazuh manager IP/host                      |
| `SYSLOG_PORT`           | `514`             | Wazuh syslog port                          |
| `SYSLOG_PROTOCOL`       | `udp`             | `udp` or `tcp`                             |
| `SYSLOG_APP_NAME`       | `cleanstream-audit` | Syslog tag                               |
| `SYSLOG_HOSTNAME`       | OS hostname       | Syslog hostname field                      |
| `SYSLOG_FACILITY`       | `16`              | Syslog facility (16 = local0)              |
| `AUDIT_LOG_PATH`        | `logs/audit.log`  | File the generator writes / forwarder tails |
| `AUDIT_GEN_INTERVAL_MS` | `5000`            | Generator write interval                   |
| `TAIL_POLL_MS`          | `1000`            | How often the forwarder polls for new lines |
| `TAIL_FROM_START`       | `false`           | `true` replays the whole file from the top |

CLI flags override `.env`:

```bash
node tools/syslog/syslog-forwarder.js --tcp --host=10.0.0.5 --port=514 --from-start
```

## Point it at Wazuh

Wazuh does **not** listen for syslog by default. On the manager, add a remote
block to `/var/ossec/etc/ossec.conf` and restart:

```xml
<remote>
  <connection>syslog</connection>
  <port>514</port>
  <protocol>udp</protocol>            <!-- or tcp -->
  <allowed-ips>YOUR.FORWARDER.IP/32</allowed-ips>
</remote>
```

```bash
sudo systemctl restart wazuh-manager
```

Received events land in `/var/ossec/logs/archives/archives.log` (enable
`<logall>` / `<logall_json>` in `ossec.conf`) and, once decoded, in
`alerts.log`.

## Decoders & rules

Custom decoder + rules that parse these events live in `tools/syslog/wazuh/`:

| Repo file                 | Copy to (on the Wazuh manager)                    |
| ------------------------- | ------------------------------------------------- |
| `cleanstream_decoder.xml` | `/var/ossec/etc/decoders/cleanstream_decoder.xml` |
| `cleanstream_rules.xml`   | `/var/ossec/etc/rules/cleanstream_rules.xml`      |

**Copy them in as new files — do not overwrite the defaults.** Wazuh loads every
`.xml` in those two directories, so the shipped `local_decoder.xml` /
`local_rules.xml` stay untouched, and my rule IDs (100100–100131) don't collide
with Wazuh's example rule (100001). Then restart:

```bash
sudo systemctl restart wazuh-manager
```

> Prefer the canonical location? You can instead paste the `<decoder>` blocks into
> `local_decoder.xml` and the whole `<group>…</group>` into `local_rules.xml` — add
> my group as a **separate** top-level group, don't nest it inside the existing one.

After restart, confirm the ruleset loaded without errors:

```bash
grep -iE 'ERROR|CRITICAL' /var/ossec/logs/ossec.log | tail
```

The decoder matches `program_name cleanstream-audit` and runs `JSON_Decoder`, so
every JSON key becomes a searchable field (`data.action`, `data.outcome`, `data.userId`, …).

> **Note:** `action` is a **reserved static field** in Wazuh, so the rules match it
> with `<action>…</action>` — using `<field name="action">` fails to load with
> "Field 'action' is static." The other keys (`outcome`, `level`, `userId`, `ip`)
> are dynamic and use `<field name="…">`.

If `JSON_Decoder` doesn't decode the syslog-wrapped JSON on your Wazuh version,
`cleanstream_decoder.xml` ships a **commented regex fallback** — comment out the
`JSON_Decoder` child, uncomment the regex child. It extracts the same field
names, so the rules below need no changes.

Rules (IDs 100100–100131):

| ID     | Level | Fires on                                                |
| ------ | ----- | ------------------------------------------------------- |
| 100100 | 0     | any decoded event (anchor, no alert)                    |
| 100110 | 3     | `user.login` + `success`                                |
| 100111 | 6     | `user.login` + `failure`                                |
| 100112 | 10    | 5+ failures for the **same** `userId` in 120s (brute force) |
| 100113 | 8     | 4+ failures in 240s, any account (demo-friendly)        |
| 100120 | 5     | `auth.rate_limited`                                     |
| 100130 | 3     | `post.create`                                           |
| 100131 | 4     | `post.moderated`                                        |

Frequency thresholds (100112/100113) are for illustration — tune to your traffic.

### Validate without waiting for live traffic

Paste a sample event into `wazuh-logtest` on the manager (it runs the full
pre-decoder → decoder → rules pipeline):

```bash
/var/ossec/bin/wazuh-logtest
# then paste this line (NOTE: no <134> priority prefix — see below):
Aug  8 01:27:55 host cleanstream-audit: {"level":"error","action":"user.login","outcome":"failure","seq":4,"userId":"u_1004","ip":"10.0.199.227","service":"cleanstream-backend"}
```

Expect: decoder `cleanstream-audit`, the JSON fields extracted, and rule `100111`
(level 6) triggered. Try an `outcome":"success"` line to see `100110` instead.

> **Why drop the `<134>`?** On the wire the forwarder sends the full RFC 3164 line
> *with* the `<134>` priority, and `wazuh-remoted` strips that prefix before
> decoding — so **live syslog works**. But `wazuh-logtest` does **not** strip it,
> so pasting a `<134>…` line makes logtest report "No decoder matched." Remove the
> `<134>` prefix for logtest testing only. (Confirmed working live: a real packet
> to port 514 fired rule 100111 with all fields decoded.)

## Verify without Wazuh

Confirm the forwarder is emitting correctly with a throwaway listener:

```bash
# UDP listener on 5514
node -e "require('dgram').createSocket('udp4').on('message',m=>console.log(m.toString())).bind(5514)"
node tools/syslog/syslog-forwarder.js --udp --port=5514

# TCP listener on 5515
node -e "require('net').createServer(s=>s.on('data',d=>process.stdout.write(d))).listen(5515)"
node tools/syslog/syslog-forwarder.js --tcp --port=5515
```

On Linux you can also watch the wire with `sudo tcpdump -A -n udp port 514`.

## Notes / limitations (it's a POC)

- **Tail** follows appends from end-of-file (`tail -f` style) and resets on
  truncation. It does not track renamed rotated files (`app.log` → `app.log.1`).
- **TCP** buffers messages in memory while disconnected and auto-reconnects
  every 2s; a long outage means unbounded queue growth.
- **UDP** is fire-and-forget — no delivery guarantee (fine for a test).
