# Rail (Extension + PWA)

Minimalist, local-first side panel for task anchoring and execution chat.

## Files
- `manifest.json`: Chrome Extension Manifest V3.
- `sidepanel.html`: UI layout (60% tasks, 40% chat).
- `styles.css`: VS Code-like dark theme.
- `script.js`: Task list, settings, and chat logic.

## Quick Test (Browser)
1. Open `sidepanel.html` directly in a browser.
2. Paste steps using the Markdown format below and click **Add Tasks**.
3. Save API settings and send a chat question.

## Task Format (Markdown)
Rail ingests tasks from Markdown headings.

- `### Step title` defines a step (becomes a task).
- Indented continuation lines under a step become step details (stored in `context_payload.details`).
- `#` (document title) and `##` (group title) are reserved for future expansion.

Example:

```md
# Project Title (optional)
## Phase A (optional)

### Implement parser
	Accept only ### headings as steps.
	Indented lines become details.

### Update docs
	Document the format in README.
```

Notes:
- Lines that are not `###` steps (and not indented details under a step) are ignored.
- The previous "one line = one task" format is intentionally not supported.

## Load in Chrome (Extension)
1. Open `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `github` folder.
4. Open the side panel from the extension toolbar.

## Run as PWA (Local)
1. Start a local static server at the project root.
2. Open the served `sidepanel.html` in a browser.
3. Use the install icon to add it as an app (optional).

## Markdown Rendering (marked.js)
Rail uses a local `marked.min.js` (no CDN) to render task details + chat bubbles as Markdown.

Setup (one-time):
1. Install the dependency:
	- `npm i marked`
2. Copy the browser (UMD) build into the project root:
	- `copy node_modules\marked\lib\marked.umd.js marked.min.js`

Notes:
- The filename must be exactly `marked.min.js` (it is referenced by `sidepanel.html`).
- Service Worker caching only works when served over `http://` / `https://` (not `file://`).

## Manual Test Plan
- **Task ingestion**: Paste multi-line text → multiple tasks appear.
- **Toggle active/done**: Click tasks to mark done; active task is highlighted.
- **Progress indicator**: Verify bottom status shows `done/total 完成` and updates on toggle.
- **Persistence**: Refresh panel → tasks and settings remain.
- **API validation**: Remove API key → sending chat alerts.
- **Context injection**: Active task, totals, and pending list appear in prompt (inspect via server logs if using a proxy).
- **Providers**: Add multiple providers, switch dropdown, and verify settings change.

## System Prompt Template
The system prompt lives in `system_prompt.txt`. You can edit it directly and use these placeholders:
- `{ACTIVE_TASK}`: Current active task text.
- `{TASK_DETAILS}`: Markdown details for the active task (or "(no details)").
- `{TOTAL_TASKS}`: Number of tasks in the list.
- `{DONE_TASKS}`: Count of completed tasks.
- `{PENDING_TASKS}`: Bullet list of pending tasks (or "All tasks completed!").
