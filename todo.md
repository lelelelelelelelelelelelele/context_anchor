# Rail 迭代计划 (V0.2.0 - Intelligence & HUD Focus)

## 1. 核心功能：🪄 结构化任务拆解 (Structural Decomposition)
- [ ] **UI 注入**：在 `renderTasks` 的任务行 `[F8:312]` 旁边增加一个 `decompose-btn`。
- [ ] **逻辑实现**：
    - 新增 `decomposeTask(taskId)` 函数。
    - 构建专用系统提示词：要求 AI 以 `###` 格式返回 3-5 个缩进的子步骤。
    - 成功后调用 `ingestTasks` 的解析部分，将新任务插入到 `tasks` 数组中该 taskId 的紧邻下方位置。
- [ ] **视觉反馈**：点击时按钮进入 `loading` 旋转状态，完成后恢复。

## 2. 极致交互：键盘驱动与流式传输
- [ ] **AI 流式响应 (Streaming)**：
    - 重构 `sendChat`，使用 `ReadableStream` 替代目前的 `await fetch().json()`。
    - 实现打字机效果渲染，提升大段代码返回时的感知速度。
- [ ] **全局快捷键 (HUD Power)**：
    - `Alt + Enter`：发送聊天消息。
    - `Alt + Check` (或特定键)：将当前 Active 任务标记为 Done 并自动激活下一个（配合纳米模式效果极佳）。
    - `Alt + N`：快速在 Inline 和 Nano 布局之间切换。

## 3. 视觉润色：HUD 细节增强
- [ ] **纳米模式边界感**：
    - 在 `renderTasks` `[F8:343]` 的切片逻辑中，如果当前是第一个任务，在列表顶部渲染一个淡色的 `[ SOURCE ]`；如果是最后一个，渲染 `[ DESTINATION ]`。
- [ ] **代码块一键复制**：
    - 在 Markdown 渲染出的 `<pre>` 标签右上角，动态增加一个透明的 "Copy" 按钮。
- [ ] **折叠状态优化**：
    - 在 `chat-collapsed` 状态下 `[F11:271]`，让输入框通过淡出效果隐藏，而非简单的 `display: none`，使切换更顺滑。

## 4. 稳定性与规范
- [ ] **Prompt 变量补全**：在 `buildSystemPrompt` `[F8:703]` 中注入 `{TASK_DETAILS}`，将当前任务的 Markdown 正文也喂给 AI 增加上下文准确度。
<!-- - [ ] **导出/备份**：增加一个简单的“导出 JSON”按钮，防止本地存储意外丢失任务进度。 -->