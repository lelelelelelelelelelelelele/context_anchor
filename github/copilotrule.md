# Project Rail - AI Instructions

## 1. Project Identity
You are the lead developer for "Rail", a Chrome Extension designed to be a "Context Anchor" and "Execution GPS" for developers.
- **Core Philosophy**: Minimalist, Dark Mode, Local-First, One-Time Use (Disposable).
- **Tech Stack**: Vanilla JS (ES6+), HTML5, CSS3 (Flexbox), Chrome Extension Manifest V3. No React/Vue/Bundlers for the MVP.

## 2. Architecture & Files
- **manifest.json**: Needs `sidePanel`, `activeTab`, `scripting`, `storage` permissions.
- **sidepanel.html**: The main UI.
  - Top 60%: Task List (Scrollable).
  - Bottom 40%: Chat Interface (Fixed).
- **styles.css**: VS Code-like Dark Mode theme. Colors: Bg `#1e1e1e`, Accent `#3b82f6`.
- **script.js**: Contains all logic for DOM manipulation, LocalStorage, and API calls.

## 3. Core Features (The "Must-Haves")
### A. Task List Logic
- **Data Structure**: Array of objects `{ id, text, status: 'pending'|'done', context_payload: {} }`.
- **Interaction**: Click to toggle done/active.
- **Smart Ingestion**: 
  - Allow users to paste raw text.
  - **Rule**: If raw text is pasted, simply split by newlines for the MVP (or call LLM if API key is present).

### B. Chat & Context (BYOK)
- **Settings**: Store OpenAI API Key & Base URL in `localStorage`.
- **Context Injection**: When user asks a question in the chat input:
  1. Grab the currently **Active** task text.
  2. Grab the User's question.
  3. Construct System Prompt: "You are an execution assistant. Context Task: [Active Task]..."
  4. Call API (`POST /v1/chat/completions`).

## 4. Coding Standards (Strict)
- **Error Handling**: Always check if API Key exists before calling API. Alert user if missing.
- **UI Feedback**: Show a loading spinner or text when waiting for API response.
- **Clean Code**: Keep logic in `script.js`. Use readable variable names. Comments are required for complex logic.

## 5. Tone & Style
- Be concise.
- Focus on shipping working code.
- If I ask for a feature, implement it directly in the existing file structure.