# Hefker WhatsApp Bot

Minimal Node.js WhatsApp automation bot for one target group.

## Features

- Persistent WhatsApp Web login (QR only needed first time)
- Event-driven real-time monitoring for one configured group
- Flexible hefker detection with ignore rules for "already taken"
- Replies `Claimed` exactly once per qualifying message
- Duplicate prevention using persisted processed message IDs
- Global on/off toggle without shutting down the process
- Clean logs for each decision

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment file:

   ```bash
   cp .env.example .env
   ```

3. Edit `.env`:
   - `TARGET_GROUP_NAME`: exact group name to monitor
   - Optional settings:
     - `BOT_ENABLED=true|false`
     - `CLAIMED_RESPONSE_TEXT=Claimed`
     - `PUPPETEER_HEADLESS=true|false`
     - `PUPPETEER_EXECUTABLE_PATH=/path/to/chrome` (only if auto-detect fails)
     - `DEBUG_LOGS=true|false`

## Run

```bash
npm start
```

On first run only:
- A QR appears in terminal
- Scan from WhatsApp mobile app:
  - Settings -> Linked Devices -> Link a Device

After successful auth, session is stored in `data/.wwebjs_auth`, so restart does not require QR again.

## Runtime Controls

Use terminal stdin commands:
- `on` -> enable bot
- `off` -> disable bot
- `status` -> show enabled state
- `help` -> print available commands

Optional WhatsApp self-commands in target group (from your own account):
- `!bot on`
- `!bot off`
- `!bot status`

## Notes

- Keep the process running for continuous monitoring.
- Bot only reacts to messages from the configured target group.
- Message IDs are persisted in `data/state.json` to avoid duplicate replies after restarts.
# Hefker
