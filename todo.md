这是结合了你的**“切任务即清空（Context Isolation）”**策略和我的**“防手滑（Safety Net）”**建议的最终执行清单。

这份清单旨在保持轻量级的同时，让它真正可用。

### 阶段一：核心逻辑重构 (Brain & Memory)

1.  **实现“任务级”会话隔离**
    *   **文件**: `script.js` (F4)
    *   **操作**: 修改 `toggleTask` 函数。
    *   **逻辑**: 在切换 `activeTaskId` 之前检测：
        *   如果新点击的 ID `!==` 当前 ID：
            1.  清空全局 `chatHistory` 数组（需新增此变量）。
            2.  清空 UI (`chatMessages.innerHTML = ""`)。
            3.  (可选) 清除 localStorage 中的临时对话缓存。
            4.  在 UI 插入一条灰色系统消息："Context switched. Memory cleared."。

2.  **实现单任务内的“多轮对话记忆”**
    *   **文件**: `script.js` (F4)
    *   **操作**: 在全局声明 `let chatHistory = [];`。
    *   **逻辑**: 修改 `sendChat` 函数：
        *   **不再**每次只发 `systemPrompt + question`。
        *   **改为**：
            1.  将用户问题 push 到 `chatHistory`。
            2.  将 `chatHistory` 完整数组传给 API `messages` 字段。
            3.  收到回复后，将 AI 回复 push 到 `chatHistory`。

3.  **注入增强版 System Prompt**
    *   **文件**: `script.js` (F4)
    *   **操作**: 更新 `sendChat` 中的 `systemPrompt` 变量。
    *   **逻辑**:
        ```javascript
        const systemPrompt = `You are a coding assistant dedicated to the Single Active Task below.
        [ACTIVE TASK]: "${activeTaskText}"
        [INSTRUCTION]:
        - Focus ONLY on this task. Forget previous tasks.
        - If I ask to fix code, assume I will paste it next.
        - Be concise and code-first.`;
        ```
    *   **目的**: 即使没有历史记录，也能通过强 prompt 立住人设。

---

### 阶段二：安全网建设 (Safety Net)

4.  **添加“防手滑”临时缓存**
    *   **文件**: `script.js` (F4)
    *   **操作**:
        *   在 `appendMessage` 后：调用 `localStorage.setItem('rail_temp_chat', JSON.stringify(chatHistory))`。
        *   在 `loadTasks` (初始化) 时：读取 `rail_temp_chat` 并恢复到 `chatHistory` 和 UI。
    *   **关键点**: 这**不冲突**第1点。切换任务时主动清空这个 key；只有在意外关闭/刷新浏览器时，这个 key 才能救命。

---

### 阶段三：基础设施与 UI (Infrastructure)

5.  **修复网络权限 (CORS/Blocking)**
    *   **文件**: `manifest.json` (F2)
    *   **操作**: 添加 `"host_permissions": ["<all_urls>"]`。
    *   **目的**: 允许你连接本地 Ollama (`localhost`) 或公司内网 API，防止被 Chrome 拦截。

6.  **折叠 API 设置栏**
    *   **文件**: `sidepanel.html` (F5) / `styles.css` (F6) / `script.js` (F4)
    *   **操作**:
        *   CSS: 给 `.settings` 默认加上 `display: none`。
        *   HTML: 加一个小按钮 `⚙️`。
        *   JS: 点击按钮 toggle `.settings` 的显示状态。
    *   **目的**: 腾出 20% 的垂直空间给聊天窗口。

---

### 建议执行顺序
**1 -> 2 -> 5 -> 4 -> 3 -> 6**

先让聊天逻辑（1, 2）跑通，再解决连网问题（5），再加缓存（4）保命，最后优化 Prompt（3）和 UI（6）。