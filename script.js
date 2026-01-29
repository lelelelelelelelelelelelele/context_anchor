const TASKS_KEY = "rail_tasks";
const ACTIVE_TASK_KEY = "rail_active_task_id";
const PROVIDERS_KEY = "rail_providers";
const ACTIVE_PROVIDER_INDEX = "rail_current_provider_idx";
const TEMP_CHAT_KEY = "rail_temp_chat";
const DEFAULT_BASE_URL = "https://api.openai.com";
const DEFAULT_MODEL = "gpt-4o-mini";
const PROMPT_PATH = "system_prompt.txt";
const DEFAULT_SYSTEM_PROMPT_TEMPLATE = `You are Rail, a developer's Execution GPS.

[MACRO GOAL / PROGRESS]
Total tasks in project: {TOTAL_TASKS}
Completed: {DONE_TASKS}/{TOTAL_TASKS}

[NEXT STEPS IN PIPELINE]
{PENDING_TASKS}

[CURRENT FOCUS (CRITICAL)]
The user is currently working on: "{ACTIVE_TASK}"

[INSTRUCTION]
1. Your answers MUST align with the Current Focus.
2. Use the Macro Goal and Next Steps only as background context to ensure consistency.
3. Be a minimalist. Give high-density, low-fluff code.`;

let tasks = [];
let activeTaskId = null;
let chatHistory = [];
let systemPromptTemplate = DEFAULT_SYSTEM_PROMPT_TEMPLATE;
let providers = [];
let currentProviderIdx = 0;

const taskInput = document.getElementById("task-input");
const addTasksButton = document.getElementById("add-tasks");
const taskList = document.getElementById("task-list");
const apiKeyInput = document.getElementById("api-key");
const baseUrlInput = document.getElementById("base-url");
const modelInput = document.getElementById("model");
const saveSettingsButton = document.getElementById("save-settings");
const providerSelect = document.getElementById("provider-select");
const addProviderButton = document.getElementById("add-provider");
const deleteProviderButton = document.getElementById("delete-provider");
const chatMessages = document.getElementById("chat-messages");
const chatStatus = document.getElementById("chat-status");
const chatInput = document.getElementById("chat-input");
const sendChatButton = document.getElementById("send-chat");
const toggleSettingsButton = document.getElementById("toggle-settings");
const settingsPanel = document.querySelector(".settings");
const clearChatButton = document.getElementById("clear-chat");

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
  const newTasks = lines
    .filter(Boolean)
    .map((text, index) => {
      const cleanedText = text.replace(
        /^([-*+]|\d+\.)\s+(\[[\s_xX]\]\s+)?/i,
        ""
      );
      return {
        id: Date.now() + index,
        text: cleanedText,
        status: "pending",
        context_payload: {},
      };
    });

  tasks = [...tasks, ...newTasks];
  taskInput.value = "";

  if (!activeTaskId && newTasks.length > 0) {
    activeTaskId = newTasks[0].id;
  }

  saveTasks();
  renderTasks();
}

function loadSettings() {
  const raw = localStorage.getItem(PROVIDERS_KEY);
  providers = raw
    ? JSON.parse(raw)
    : [
        {
          name: "Default",
          key: "",
          url: DEFAULT_BASE_URL,
          model: DEFAULT_MODEL,
        },
      ];
  currentProviderIdx = Number(localStorage.getItem(ACTIVE_PROVIDER_INDEX)) || 0;
  if (currentProviderIdx >= providers.length) {
    currentProviderIdx = 0;
  }
  renderProviderOptions();
  fillSettingsFields();
}

function saveSettings() {
  const provider = providers[currentProviderIdx];
  provider.key = apiKeyInput.value.trim();
  provider.url = baseUrlInput.value.trim();
  provider.model = modelInput.value.trim();
  localStorage.setItem(PROVIDERS_KEY, JSON.stringify(providers));
  localStorage.setItem(ACTIVE_PROVIDER_INDEX, String(currentProviderIdx));
  renderProviderOptions();
}

function renderProviderOptions() {
  providerSelect.innerHTML = providers
    .map((provider, index) => {
      const selected = index === currentProviderIdx ? "selected" : "";
      const name = provider.name?.trim() || `Config ${index + 1}`;
      return `<option value="${index}" ${selected}>${name}</option>`;
    })
    .join("");
}

function fillSettingsFields() {
  const provider = providers[currentProviderIdx];
  apiKeyInput.value = provider?.key || "";
  baseUrlInput.value = provider?.url || DEFAULT_BASE_URL;
  modelInput.value = provider?.model || DEFAULT_MODEL;
}

function addProvider() {
  const name = prompt("Provider Name:", "New Config");
  if (!name) {
    return;
  }
  providers.push({
    name,
    key: "",
    url: DEFAULT_BASE_URL,
    model: DEFAULT_MODEL,
  });
  currentProviderIdx = providers.length - 1;
  saveSettings();
  fillSettingsFields();
}

function deleteProvider() {
  if (providers.length <= 1) {
    alert("At least one provider is required.");
    return;
  }
  providers.splice(currentProviderIdx, 1);
  currentProviderIdx = Math.max(0, currentProviderIdx - 1);
  saveSettings();
  fillSettingsFields();
}

function appendMessage(role, content) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = content;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  persistChatHistory();
}

async function loadSystemPrompt() {
  try {
    const promptUrl =
      typeof chrome !== "undefined" && chrome.runtime?.getURL
        ? chrome.runtime.getURL(PROMPT_PATH)
        : PROMPT_PATH;
    const response = await fetch(promptUrl);
    if (!response.ok) {
      return;
    }
    const text = await response.text();
    if (text && text.trim()) {
      systemPromptTemplate = text.trim();
    }
  } catch (error) {
    systemPromptTemplate = DEFAULT_SYSTEM_PROMPT_TEMPLATE;
  }
}

function buildSystemPrompt(activeTaskText) {
  const template = systemPromptTemplate || DEFAULT_SYSTEM_PROMPT_TEMPLATE;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((task) => task.status === "done").length;
  const pendingTasks = tasks
    .filter((task) => task.status === "pending")
    .map((task) => `- ${task.text}`)
    .join("\n");
  const pendingText = pendingTasks || "All tasks completed!";

  return template
    .replaceAll("{TOTAL_TASKS}", String(totalTasks))
    .replaceAll("{DONE_TASKS}", String(doneTasks))
    .replaceAll("{PENDING_TASKS}", pendingText)
    .replaceAll("{ACTIVE_TASK}", activeTaskText);
}

function persistChatHistory() {
  localStorage.setItem(TEMP_CHAT_KEY, JSON.stringify(chatHistory));
}

function clearChatContext() {
  chatHistory = [];
  chatMessages.innerHTML = "";
  localStorage.removeItem(TEMP_CHAT_KEY);
  appendMessage("system", "Context switched. Memory cleared.");
}

function clearChatHistory() {
  chatHistory = [];
  chatMessages.innerHTML = "";
  localStorage.removeItem(TEMP_CHAT_KEY);
  appendMessage("system", "Chat cleared.");
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
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const endpointUrl = `${normalizedBaseUrl}/chat/completions`;
  const model = modelInput.value.trim() || DEFAULT_MODEL;
  const activeTask = tasks.find((task) => task.id === activeTaskId);
  const activeTaskText = activeTask ? activeTask.text : "None";

  chatInput.value = "";
  appendMessage("user", question);
  chatStatus.textContent = "Thinking...";

  // Inject active task context into the system prompt.
  const systemPrompt = buildSystemPrompt(activeTaskText);

  chatHistory.push({ role: "user", content: question });

  try {
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
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
clearChatButton.addEventListener("click", clearChatHistory);
providerSelect.addEventListener("change", (event) => {
  currentProviderIdx = Number(event.target.value);
  fillSettingsFields();
  localStorage.setItem(ACTIVE_PROVIDER_INDEX, String(currentProviderIdx));
});
addProviderButton.addEventListener("click", addProvider);
deleteProviderButton.addEventListener("click", deleteProvider);
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
  loadSystemPrompt();
  if ("serviceWorker" in navigator && window.location.protocol !== "chrome-extension:") {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
});
