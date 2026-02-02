# do in the future(not now)
*   **流式传输 (Streaming) 缺失**:
    *   在 `sendChat` `[F5:470]` 中使用了 `await fetch` 等待完整返回。对于较长的 AI 回复，界面会卡在 "Thinking..." 状态较久。
    *   **建议**: 未来可以引入 `ReadableStream` 来实现打字机效果。

1.  **UI 反馈增强**:
    在 `[F8:113-116]` 的 `.task-item.active` 样式中，可以增加一个微弱的脉动动画（Pulse），视觉上强调这是当前的 "Execution GPS" 焦点。
2.  **快捷键绑定**:
    在 `[F5:514]` 的 `keydown` 监听中，建议增加 `Ctrl+Enter` 发送消息，并增加一个快捷键用于快速勾选当前任务为 Done。
