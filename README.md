# Rail (Extension + PWA)

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

## Load in Chrome (Extension)
1. Open `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `github` folder.
4. Open the side panel from the extension toolbar.

## Run as PWA (Local)
1. Start a local static server at the project root.
2. Open the served `sidepanel.html` in a browser.
3. Use the install icon to add it as an app (optional).

## Manual Test Plan
- **Task ingestion**: Paste multi-line text → multiple tasks appear.
- **Toggle active/done**: Click tasks to mark done; active task is highlighted.
- **Persistence**: Refresh panel → tasks and settings remain.
- **API validation**: Remove API key → sending chat alerts.
- **Context injection**: Active task, totals, and pending list appear in prompt (inspect via server logs if using a proxy).
- **Providers**: Add multiple providers, switch dropdown, and verify settings change.

## System Prompt Template
The system prompt lives in `system_prompt.txt`. You can edit it directly and use these placeholders:
- `{ACTIVE_TASK}`: Current active task text.
- `{TOTAL_TASKS}`: Number of tasks in the list.
- `{DONE_TASKS}`: Count of completed tasks.
- `{PENDING_TASKS}`: Bullet list of pending tasks (or "All tasks completed!").
