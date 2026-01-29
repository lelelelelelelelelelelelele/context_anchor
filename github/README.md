# Rail (Chrome Extension MVP)

Minimalist, local-first side panel for task anchoring and execution chat.

## Files
- `manifest.json`: Chrome Extension Manifest V3.
- `sidepanel.html`: UI layout (60% tasks, 40% chat).
- `styles.css`: VS Code-like dark theme.
- `script.js`: Task list, settings, and chat logic.

## Quick Test (Browser)
1. Open `sidepanel.html` directly in a browser.
2. Paste tasks (one per line) and click **Add Tasks**.
3. Save API settings and send a chat question.

## Load in Chrome
1. Open `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `github` folder.
4. Open the side panel from the extension toolbar.

## Manual Test Plan
- **Task ingestion**: Paste multi-line text → multiple tasks appear.
- **Toggle active/done**: Click tasks to mark done; active task is highlighted.
- **Persistence**: Refresh panel → tasks and settings remain.
- **API validation**: Remove API key → sending chat alerts.
- **Context injection**: Active task text appears in API prompt (inspect via server logs if using a proxy).
