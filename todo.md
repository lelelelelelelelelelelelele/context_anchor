# Rail 迭代计划 (Current Focus)

## 1. 增强型 System Prompt 落地
- [ ] 将 `system_prompt.txt` 更新为“执行 GPS”模式，强化对当前任务的约束。
- [ ] 在 Prompt 中加入“下一步影响分析”指令。

## 2. 结构化任务拆解 (Structural Decomposition)
- [ ] **UI 增强**：在每个 `.task-item` 中增加一个“拆解”图标/按钮。
- [ ] **拆解逻辑**：
	- 点击拆解时，将该任务文本作为 `user` 消息，并配合特定的 `decomposition_prompt` 调用 API。
	- AI 返回子任务列表（JSON 或换行文本）。
	- 自动调用 `ingestTasks()` 将子任务插入当前任务下方。

## 3. 部署与环境同步
- [ ] 确保 `manifest.json` 与 `manifest.webmanifest` 的版本号同步。
- [ ] 验证 Service Worker 在非 localhost 环境下的 HTTPS 限制。