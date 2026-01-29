const TASKS_KEY = "rail_tasks";
const ACTIVE_TASK_KEY = "rail_active_task_id";
const API_KEY_STORAGE = "rail_api_key";
const BASE_URL_STORAGE = "rail_base_url";
const TEMP_CHAT_KEY = "rail_temp_chat";
const DEFAULT_BASE_URL = "https://api.openai.com";
const DEFAULT_MODEL = "gpt-4o-mini";

let tasks = [];
let activeTaskId = null;
let chatHistory = [];

const taskInput = document.getElementById("task-input");
const addTasksButton = document.getElementById("add-tasks");
const taskList = document.getElementById("task-list");
const apiKeyInput = document.getElementById("api-key");
const baseUrlInput = document.getElementById("base-url");
const saveSettingsButton = document.getElementById("save-settings");
const chatMessages = document.getElementById("chat-messages");
const chatStatus = document.getElementById("chat-status");
const chatInput = document.getElementById("chat-input");
const sendChatButton = document.getElementById("send-chat");
const toggleSettingsButton = document.getElementById("toggle-settings");
const settingsPanel = document.querySelector(".settings");

function loadTasks() {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  } catch (error) {
    tasks = [];
  }

  const storedActive = localStorage.getItem(ACTIVE_TASK_KEY);
  activeTaskId = storedActive ? Number(storedActive) : null;

  if (!tasks.find((task) => task.id === activeTaskId)) {
    activeTaskId = null;
  }

  if (!activeTaskId) {
    const firstPending = tasks.find((task) => task.status === "pending");
    activeTaskId = firstPending ? firstPending.id : null;
  }

  const cachedChat = localStorage.getItem(TEMP_CHAT_KEY);
  if (cachedChat) {
    try {
      const parsed = JSON.parse(cachedChat);
      if (Array.isArray(parsed)) {
        chatHistory = parsed;
      }
    } catch (error) {
      chatHistory = [];
    }
  }
}

function saveTasks() {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  if (activeTaskId) {
    localStorage.setItem(ACTIVE_TASK_KEY, String(activeTaskId));
  } else {
    localStorage.removeItem(ACTIVE_TASK_KEY);
  }
}

function renderTasks() {
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "task-status";
    empty.textContent = "No tasks yet. Paste a list to begin.";
    taskList.appendChild(empty);
    return;
  }

  tasks.forEach((task) => {
    const item = document.createElement("div");
    item.className = "task-item";
    if (task.status === "done") {
      item.classList.add("done");
    }
    if (task.id === activeTaskId) {
      item.classList.add("active");
    }
    item.dataset.id = String(task.id);

    const text = document.createElement("span");
    text.textContent = task.text;

    const status = document.createElement("span");
    status.className = "task-status";
    status.textContent = task.status === "done" ? "Done" : "Active";

    item.appendChild(text);
    item.appendChild(status);

    item.addEventListener("click", () => toggleTask(task.id));
    taskList.appendChild(item);
  });
}

function toggleTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    return;
  }

  const switchingTask = activeTaskId && taskId !== activeTaskId;
  if (switchingTask) {
    clearChatContext();
  }

  if (taskId !== activeTaskId) {
    activeTaskId = task.id;
    if (task.status === "done") {
      task.status = "pending";
    }
  } else {
    task.status = task.status === "done" ? "pending" : "done";
    if (task.status === "done") {
      const nextPending = tasks.find((item) => item.status === "pending");
      activeTaskId = nextPending ? nextPending.id : null;
    }
  }

  saveTasks();
  renderTasks();
}

function ingestTasks() {
  const rawText = taskInput.value.trim();
  if (!rawText) {
    return;
  }

  // MVP rule: split raw text by newline into tasks.
  const lines = rawText.split(/\r?\n/).map((line) => line.trim());
  const newTasks = lines.filter(Boolean).map((text, index) => ({
    id: Date.now() + index,
    text,
    status: "pending",
    context_payload: {},
  }));

  tasks = [...tasks, ...newTasks];
  taskInput.value = "";

  if (!activeTaskId && newTasks.length > 0) {
    activeTaskId = newTasks[0].id;
  }

  saveTasks();
  renderTasks();
}

function loadSettings() {
  apiKeyInput.value = localStorage.getItem(API_KEY_STORAGE) || "";
  baseUrlInput.value =
    localStorage.getItem(BASE_URL_STORAGE) || DEFAULT_BASE_URL;
}

function saveSettings() {
  localStorage.setItem(API_KEY_STORAGE, apiKeyInput.value.trim());
  localStorage.setItem(BASE_URL_STORAGE, baseUrlInput.value.trim());
}

function appendMessage(role, content) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = content;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  persistChatHistory();
}

function persistChatHistory() {
  localStorage.setItem(TEMP_CHAT_KEY, JSON.stringify(chatHistory));
}

function clearChatContext() {
  chatHistory = [];
  chatMessages.innerHTML = "";
  localStorage.removeItem(TEMP_CHAT_KEY);
  chatHistory.push({ role: "system", content: "Context switched. Memory cleared." });
  appendMessage("system", "Context switched. Memory cleared.");
}

function restoreChatHistory() {
  if (chatHistory.length === 0) {
    return;
  }

  chatMessages.innerHTML = "";
  chatHistory.forEach((message) => {
    if (!message?.role || !message?.content) {
      return;
    }
    appendMessage(message.role, message.content);
  });
}

async function sendChat() {
  const question = chatInput.value.trim();
  if (!question) {
    return;
  }

  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    alert("Missing API Key. Please save your key first.");
    return;
  }

  const baseUrl = baseUrlInput.value.trim() || DEFAULT_BASE_URL;
  const activeTask = tasks.find((task) => task.id === activeTaskId);
  const activeTaskText = activeTask ? activeTask.text : "None";

  chatInput.value = "";
  appendMessage("user", question);
  chatStatus.textContent = "Thinking...";

  // Inject active task context into the system prompt.
  const systemPrompt = `You are a coding assistant dedicated to the Single Active Task below.
[ACTIVE TASK]: "${activeTaskText}"
[INSTRUCTION]:
- Focus ONLY on this task. Forget previous tasks.
- If I ask to fix code, assume I will paste it next.
- Be concise and code-first.`;

  chatHistory.push({ role: "user", content: question });

  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...chatHistory],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "API request failed.");
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content || "No response from assistant.";
    chatHistory.push({ role: "assistant", content: reply });
    appendMessage("assistant", reply);
  } catch (error) {
    appendMessage("assistant", `Error: ${error.message}`);
  } finally {
    chatStatus.textContent = "";
  }
}

addTasksButton.addEventListener("click", ingestTasks);
saveSettingsButton.addEventListener("click", saveSettings);
sendChatButton.addEventListener("click", sendChat);
toggleSettingsButton.addEventListener("click", () => {
  settingsPanel.classList.toggle("visible");
});
chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendChat();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  loadSettings();
  renderTasks();
  restoreChatHistory();
});
