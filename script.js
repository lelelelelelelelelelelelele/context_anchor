const TASKS_KEY = "rail_tasks";
const ACTIVE_TASK_KEY = "rail_active_task_id";
const PROVIDERS_KEY = "rail_providers";
const ACTIVE_PROVIDER_INDEX = "rail_current_provider_idx";
const LAYOUT_MODE_KEY = "rail_layout_mode";
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
Task details (Markdown):
{TASK_DETAILS}

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
let layoutMode = "split";
let chatCollapsed = true;

const taskInput = document.getElementById("task-input");
const addTasksButton = document.getElementById("add-tasks");
const overviewTasksButton = document.getElementById("overview-tasks");
const clearTasksButton = document.getElementById("clear-tasks");
const taskList = document.getElementById("task-list");
const taskDocTitle = document.getElementById("task-doc-title");
const taskDetailsPanel = document.getElementById("task-details");
const taskDetailsStep = document.getElementById("task-details-step");
const taskDetailsMeta = document.getElementById("task-details-meta");
const taskDetailsBody = document.getElementById("task-details-body");
const taskProgress = document.getElementById("task-progress");
const chatMessages = document.getElementById("chat-messages");
const chatStatus = document.getElementById("chat-status");
const chatInput = document.getElementById("chat-input");
const sendChatButton = document.getElementById("send-chat");
const clearChatButton = document.getElementById("clear-chat");
const chatDrawerToggle = document.getElementById("chat-drawer-toggle");

// Page navigation
const mainPage = document.getElementById("main-page");
const settingsPage = document.getElementById("settings-page");
const openSettingsButton = document.getElementById("open-settings");
const settingsBackButton = document.getElementById("settings-back");

// Settings page controls
const providersList = document.getElementById("providers-list");
const providerNewButton = document.getElementById("provider-new");
const providerNameInput = document.getElementById("provider-name");
const providerKeyInput = document.getElementById("provider-key");
const providerUrlInput = document.getElementById("provider-url");
const providerModelInput = document.getElementById("provider-model");
const providerSaveButton = document.getElementById("provider-save");
const providerDeleteButton = document.getElementById("provider-delete");
const layoutModeSelect = document.getElementById("layout-mode");

let markedConfigured = false;

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function configureMarkedOnce() {
  if (markedConfigured) {
    return;
  }
  const markedApi = typeof window !== "undefined" ? window.marked : null;
  if (!markedApi || typeof markedApi.setOptions !== "function") {
    return;
  }

  // Security: we still sanitize output below; these options mostly improve UX.
  markedApi.setOptions({
    breaks: true,
    gfm: true,
    headerIds: false,
    mangle: false,
  });
  markedConfigured = true;
}

function sanitizeRenderedHtml(unsafeHtml) {
  const template = document.createElement("template");
  template.innerHTML = String(unsafeHtml || "");

  const blockedTags = new Set([
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "link",
    "meta",
  ]);

  const allowedProtocols = new Set(["http:", "https:", "mailto:"]);

  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
  const elements = [];
  while (walker.nextNode()) {
    elements.push(walker.currentNode);
  }

  for (const el of elements) {
    const tagName = el.tagName ? el.tagName.toLowerCase() : "";
    if (blockedTags.has(tagName)) {
      el.remove();
      continue;
    }

    for (const attr of Array.from(el.attributes || [])) {
      const name = attr.name.toLowerCase();
      const value = attr.value;

      if (name.startsWith("on") || name === "style") {
        el.removeAttribute(attr.name);
        continue;
      }

      if (name === "href" || name === "src") {
        const trimmed = String(value || "").trim();
        if (!trimmed) {
          continue;
        }

        // Allow in-page anchors and relative URLs.
        if (trimmed.startsWith("#") || trimmed.startsWith("/") || trimmed.startsWith(".")) {
          continue;
        }

        try {
          const parsed = new URL(trimmed, window.location.href);
          if (!allowedProtocols.has(parsed.protocol)) {
            el.removeAttribute(attr.name);
          }
        } catch (error) {
          el.removeAttribute(attr.name);
        }
      }
    }
  }

  return template.innerHTML;
}

function renderMarkdownToSafeHtml(markdownText) {
  const source = String(markdownText || "");
  const markedApi = typeof window !== "undefined" ? window.marked : null;
  if (!markedApi || typeof markedApi.parse !== "function") {
    // Fallback: escape and preserve line breaks.
    return escapeHtml(source).replaceAll("\n", "<br>");
  }

  configureMarkedOnce();
  const rendered = markedApi.parse(source);
  return sanitizeRenderedHtml(rendered);
}

function persistLayoutMode() {
  localStorage.setItem(LAYOUT_MODE_KEY, layoutMode);
}

function applyLayoutMode() {
  if (!document.body) {
    return;
  }
  document.body.classList.toggle("layout-inline", layoutMode === "inline");
  document.body.classList.toggle("layout-nano", layoutMode === "nano");
}

function setChatCollapsed(nextCollapsed) {
  chatCollapsed = Boolean(nextCollapsed);
  if (document.body) {
    document.body.classList.toggle("chat-collapsed", chatCollapsed);
  }
  if (chatDrawerToggle) {
    chatDrawerToggle.textContent = chatCollapsed ? "▼" : "▲";
    chatDrawerToggle.setAttribute("aria-expanded", chatCollapsed ? "false" : "true");
  }
}

function openSettingsPage() {
  if (mainPage) {
    mainPage.classList.add("hidden");
  }
  if (settingsPage) {
    settingsPage.classList.remove("hidden");
  }
  renderProvidersList();
  fillProviderForm();
  if (layoutModeSelect) {
    layoutModeSelect.value = layoutMode;
  }
}

function openMainPage() {
  if (settingsPage) {
    settingsPage.classList.add("hidden");
  }
  if (mainPage) {
    mainPage.classList.remove("hidden");
  }
}

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

function ensureActiveTaskSelection() {
  if (activeTaskId && tasks.find((task) => task.id === activeTaskId)) {
    return;
  }

  if (layoutMode === "nano") {
    activeTaskId = null;
    return;
  }

  const firstPending = tasks.find((task) => task.status === "pending");
  activeTaskId = firstPending ? firstPending.id : null;
  saveTasks();
}

function saveTasks() {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  if (activeTaskId) {
    localStorage.setItem(ACTIVE_TASK_KEY, String(activeTaskId));
  } else {
    localStorage.removeItem(ACTIVE_TASK_KEY);
  }
}

function getActiveTask() {
  if (!activeTaskId) {
    return null;
  }
  return tasks.find((task) => task.id === activeTaskId) || null;
}

function getActiveTaskMeta(task) {
  const payload = task?.context_payload || {};
  const documentTitle = payload.document_title || null;
  const groupTitle = payload.group_title || null;
  const details = payload.details || "";
  return { documentTitle, groupTitle, details };
}

function renderActiveTaskDetails() {
  applyLayoutMode();

  const activeTask = getActiveTask();
  const { documentTitle, groupTitle, details } = getActiveTaskMeta(activeTask);

  if (taskDocTitle) {
    taskDocTitle.textContent = documentTitle ? `# ${documentTitle}` : "";
  }

  if (!taskDetailsPanel || layoutMode !== "split") {
    return;
  }

  if (!activeTask) {
    taskDetailsStep.textContent = "No active step";
    taskDetailsMeta.textContent = "";
    taskDetailsBody.textContent = "Select a step to view details.";
    return;
  }

  taskDetailsStep.textContent = activeTask.text;
  taskDetailsMeta.textContent = groupTitle ? `## ${groupTitle}` : "";
  taskDetailsBody.innerHTML = renderMarkdownToSafeHtml(details || "(no details)");
}

function renderTasks() {
  taskList.innerHTML = "";

  renderActiveTaskDetails();

  if (taskProgress) {
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((task) => task.status === "done").length;
    taskProgress.textContent = `${doneTasks}/${totalTasks} 完成`;
  }

  if (tasks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "task-status";
    empty.textContent = "No tasks yet. Paste a list to begin.";
    taskList.appendChild(empty);
    renderActiveTaskDetails();
    return;
  }

  let tasksToRender = tasks;
  let activeIdx = -1;
  const isNanoMode = layoutMode === "nano";
  if (isNanoMode && activeTaskId) {
    activeIdx = tasks.findIndex((t) => t.id === activeTaskId);
    if (activeIdx >= 0) {
      const start = Math.max(0, activeIdx - 1);
      const end = Math.min(tasks.length, activeIdx + 2);
      tasksToRender = tasks.slice(start, end);
    }
  }

  if (document.body) {
    document.body.classList.toggle("nano-view", isNanoMode && activeIdx >= 0);
  }

  tasksToRender.forEach((task) => {
    const item = document.createElement("div");
    item.className = "task-item";
    if (task.status === "done") {
      item.classList.add("done");
    }
    if (task.id === activeTaskId) {
      item.classList.add("active");
    } else if (isNanoMode && activeIdx >= 0) {
      item.classList.add("nano-secondary");
    }
    item.dataset.id = String(task.id);

    const row = document.createElement("div");
    row.className = "task-item-row";

    const text = document.createElement("span");
    text.textContent = task.text;

    const status = document.createElement("span");
    status.className = "task-status";
    status.textContent = task.status === "done" ? "Done" : "Active";

    row.appendChild(text);
    row.appendChild(status);
    item.appendChild(row);

    if ((layoutMode === "inline" || layoutMode === "nano") && task.id === activeTaskId) {
      const { documentTitle, groupTitle, details } = getActiveTaskMeta(task);
      const metaParts = [];
      if (documentTitle) {
        metaParts.push(`# ${documentTitle}`);
      }
      if (groupTitle) {
        metaParts.push(`## ${groupTitle}`);
      }

      if (metaParts.length > 0) {
        const meta = document.createElement("div");
        meta.className = "task-inline-meta";
        meta.textContent = metaParts.join(" · ");
        item.appendChild(meta);
      }

      const body = document.createElement("div");
      body.className = "task-inline-details md";
      body.innerHTML = renderMarkdownToSafeHtml(details || "(no details)");
      item.classList.add("with-details");
      item.appendChild(body);
    }

    item.addEventListener("click", () => toggleTask(task.id));
    taskList.appendChild(item);
  });

  renderActiveTaskDetails();
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
  const rawText = taskInput.value;
  if (!rawText || !rawText.trim()) {
    return;
  }

  // Spec (v1):
  // - `### ` headings define steps (ingested as tasks).
  // - Indented continuation lines under a step become `context_payload.details`.
  // - `#` (doc title) and `##` (group) are captured as metadata for future use.
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");

  let documentTitle = null;
  let groupTitle = null;

  const steps = [];
  let currentStep = null;

  function flushCurrentStep() {
    if (!currentStep) {
      return;
    }

    const details = currentStep.detailsLines
      .join("\n")
      .replace(/\s+$/g, "");
    steps.push({
      text: currentStep.text,
      documentTitle: currentStep.documentTitle,
      groupTitle: currentStep.groupTitle,
      details,
    });
    currentStep = null;
  }

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (!trimmed.trim()) {
      continue;
    }

    const headerMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const title = (headerMatch[2] || "").trim();
      if (!title) {
        continue;
      }

      if (level === 1) {
        flushCurrentStep();
        documentTitle = title;
        continue;
      }

      if (level === 2) {
        flushCurrentStep();
        groupTitle = title;
        continue;
      }

      if (level === 3) {
        flushCurrentStep();
        currentStep = {
          text: title,
          documentTitle,
          groupTitle,
          detailsLines: [],
        };
        continue;
      }
    }

    const isIndented = /^\s+/.test(line);
    if (currentStep && isIndented) {
      const normalized = line.startsWith("\t")
        ? line.slice(1)
        : line.replace(/^\s{1,2}/, "");
      currentStep.detailsLines.push(normalized.trimEnd());
    }
  }

  flushCurrentStep();
  if (steps.length === 0) {
    alert("No steps found. Use Markdown headings like `### Step name`.");
    return;
  }

  const newTasks = steps.map((step, index) => ({
    id: Date.now() + index,
    text: step.text,
    status: "pending",
    context_payload: {
      document_title: step.documentTitle,
      group_title: step.groupTitle,
      details: step.details,
    },
  }));

  tasks = [...tasks, ...newTasks];
  taskInput.value = "";

  if (!activeTaskId && newTasks.length > 0 && layoutMode !== "nano") {
    activeTaskId = newTasks[0].id;
  }

  saveTasks();
  renderTasks();
}

function clearAllTasks() {
  if (tasks.length === 0) {
    return;
  }

  const confirmed = confirm("Clear all tasks? This cannot be undone.");
  if (!confirmed) {
    return;
  }

  tasks = [];
  activeTaskId = null;
  saveTasks();
  renderTasks();

  chatHistory = [];
  chatMessages.innerHTML = "";
  persistChatHistory();
  appendMessage("system", "Tasks cleared.");
}

function showOverview() {
  if (!activeTaskId) {
    return;
  }
  activeTaskId = null;
  saveTasks();
  renderTasks();
}

function normalizeProviders(raw) {
  const parsed = Array.isArray(raw) ? raw : [];
  const normalized = parsed
    .map((p, idx) => ({
      name: (p?.name || `Config ${idx + 1}`).trim(),
      key: (p?.key || "").trim(),
      url: (p?.url || DEFAULT_BASE_URL).trim(),
      model: (p?.model || DEFAULT_MODEL).trim(),
    }))
    .filter((p) => p.name);

  if (normalized.length === 0) {
    normalized.push({
      name: "Default",
      key: "",
      url: DEFAULT_BASE_URL,
      model: DEFAULT_MODEL,
    });
  }
  return normalized;
}

function persistProviders() {
  localStorage.setItem(PROVIDERS_KEY, JSON.stringify(providers));
  localStorage.setItem(ACTIVE_PROVIDER_INDEX, String(currentProviderIdx));
}

function loadSettings() {
  const raw = localStorage.getItem(PROVIDERS_KEY);
  let parsed;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch (error) {
    parsed = null;
  }
  providers = normalizeProviders(parsed);

  currentProviderIdx = Number(localStorage.getItem(ACTIVE_PROVIDER_INDEX)) || 0;
  if (currentProviderIdx < 0 || currentProviderIdx >= providers.length) {
    currentProviderIdx = 0;
  }

  const storedLayout = localStorage.getItem(LAYOUT_MODE_KEY);
  layoutMode = storedLayout === "inline" || storedLayout === "split" || storedLayout === "nano" ? storedLayout : "split";
  if (layoutModeSelect) {
    layoutModeSelect.value = layoutMode;
  }
}

function renderProvidersList() {
  if (!providersList) {
    return;
  }

  providersList.innerHTML = "";
  providers.forEach((provider, index) => {
    const row = document.createElement("div");
    row.className = "provider-row";
    if (index === currentProviderIdx) {
      row.classList.add("active");
    }

    const main = document.createElement("div");
    main.className = "provider-row-main";

    const name = document.createElement("div");
    name.className = "provider-row-name";
    name.textContent = provider.name || `Config ${index + 1}`;

    const meta = document.createElement("div");
    meta.className = "provider-row-meta";
    const url = (provider.url || DEFAULT_BASE_URL).replace(/\/+$/, "");
    meta.textContent = `${url} · ${provider.model || DEFAULT_MODEL}`;

    main.appendChild(name);
    main.appendChild(meta);

    const badge = document.createElement("div");
    badge.className = "provider-row-badge";
    badge.textContent = index === currentProviderIdx ? "Selected" : "Use";

    row.appendChild(main);
    row.appendChild(badge);
    row.addEventListener("click", () => {
      currentProviderIdx = index;
      localStorage.setItem(ACTIVE_PROVIDER_INDEX, String(currentProviderIdx));
      renderProvidersList();
      fillProviderForm();
    });
    providersList.appendChild(row);
  });
}

function fillProviderForm() {
  const provider = providers[currentProviderIdx];
  if (!provider) {
    return;
  }
  if (providerNameInput) {
    providerNameInput.value = provider.name || "";
  }
  if (providerKeyInput) {
    providerKeyInput.value = provider.key || "";
  }
  if (providerUrlInput) {
    providerUrlInput.value = provider.url || DEFAULT_BASE_URL;
  }
  if (providerModelInput) {
    providerModelInput.value = provider.model || DEFAULT_MODEL;
  }
}

function saveSelectedProviderFromForm() {
  const provider = providers[currentProviderIdx];
  if (!provider) {
    return;
  }

  provider.name = (providerNameInput?.value || provider.name || "").trim() || provider.name;
  provider.key = (providerKeyInput?.value || "").trim();
  provider.url = (providerUrlInput?.value || DEFAULT_BASE_URL).trim() || DEFAULT_BASE_URL;
  provider.model = (providerModelInput?.value || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
  persistProviders();
  renderProvidersList();
}

function createNewProvider() {
  const nextName = `Config ${providers.length + 1}`;
  providers.push({
    name: nextName,
    key: "",
    url: DEFAULT_BASE_URL,
    model: DEFAULT_MODEL,
  });
  currentProviderIdx = providers.length - 1;
  persistProviders();
  renderProvidersList();
  fillProviderForm();
}

function deleteSelectedProvider() {
  if (providers.length <= 1) {
    alert("At least one API config is required.");
    return;
  }
  const confirmed = confirm("Delete selected API config?");
  if (!confirmed) {
    return;
  }
  providers.splice(currentProviderIdx, 1);
  currentProviderIdx = Math.max(0, currentProviderIdx - 1);
  persistProviders();
  renderProvidersList();
  fillProviderForm();
}

function appendMessage(role, content) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role} md`;
  bubble.innerHTML = renderMarkdownToSafeHtml(content);
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
  const activeTaskDetails = getActiveTaskMeta(getActiveTask()).details || "(no details)";
  const pendingTasks = tasks
    .filter((task) => task.status === "pending")
    .map((task) => `- ${task.text}`)
    .join("\n");
  const pendingText = pendingTasks || "All tasks completed!";

  return template
    .replaceAll("{TOTAL_TASKS}", String(totalTasks))
    .replaceAll("{DONE_TASKS}", String(doneTasks))
    .replaceAll("{PENDING_TASKS}", pendingText)
    .replaceAll("{ACTIVE_TASK}", activeTaskText)
    .replaceAll("{TASK_DETAILS}", activeTaskDetails);
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

  const provider = providers[currentProviderIdx] || {
    name: "Default",
    key: "",
    url: DEFAULT_BASE_URL,
    model: DEFAULT_MODEL,
  };

  const apiKey = (provider.key || "").trim();
  if (!apiKey) {
    alert("Missing API Key. Open Settings to configure an API.");
    return;
  }

  const baseUrl = (provider.url || DEFAULT_BASE_URL).trim() || DEFAULT_BASE_URL;
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const endpointUrl = `${normalizedBaseUrl}/chat/completions`;
  const model = (provider.model || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
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
if (overviewTasksButton) {
  overviewTasksButton.addEventListener("click", showOverview);
}
clearTasksButton.addEventListener("click", clearAllTasks);
sendChatButton.addEventListener("click", sendChat);
clearChatButton.addEventListener("click", clearChatHistory);

if (openSettingsButton) {
  openSettingsButton.addEventListener("click", openSettingsPage);
}

if (settingsBackButton) {
  settingsBackButton.addEventListener("click", openMainPage);
}

if (providerNewButton) {
  providerNewButton.addEventListener("click", createNewProvider);
}

if (providerSaveButton) {
  providerSaveButton.addEventListener("click", saveSelectedProviderFromForm);
}

if (providerDeleteButton) {
  providerDeleteButton.addEventListener("click", deleteSelectedProvider);
}

if (layoutModeSelect) {
  layoutModeSelect.addEventListener("change", (event) => {
    const value = event.target.value;
    layoutMode = value === "inline" || value === "split" || value === "nano" ? value : "split";
    persistLayoutMode();
    ensureActiveTaskSelection();
    renderTasks();
  });
}

if (chatDrawerToggle) {
  chatDrawerToggle.addEventListener("click", () => {
    setChatCollapsed(!chatCollapsed);
  });
}

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendChat();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  loadTasks();
  ensureActiveTaskSelection();
  applyLayoutMode();
  renderProvidersList();
  fillProviderForm();
  renderTasks();
  restoreChatHistory();
  loadSystemPrompt();
  setChatCollapsed(true);
  if ("serviceWorker" in navigator && window.location.protocol !== "chrome-extension:") {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
});
