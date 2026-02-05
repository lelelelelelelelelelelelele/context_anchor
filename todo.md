# Rail 迭代计划 (V0.2.1 - Intelligence & HUD Focus)

## 1. AI 上下文进阶 (Intelligence)
- [ ] **项目全局记事本 (Global Context)**：
    - 增加一个持久化的“项目全局记事本”设置。
    - 在 `buildSystemPrompt` 中注入 `{PROJECT_CONTEXT}` 变量。
    - 允许存放通用规则（如：编码规范、架构约束）。 * 暂时不加入，保持轻量

## 2. 交互与动效 (Interactions & Animations)
- [ ] **任务完成微动画**：点击完成时增加复选框缩放及删除线平滑划过效果。
- [ ] **页面平滑切换**：主页、编辑器、设置页切换时增加淡入淡出或位移过渡。
- [ ] **活跃任务视觉引导**：在当前任务左侧增加动态的“活动条”指示器。
- [ ] **空状态美化**：优化无任务/无配置时的显示，增加引导性操作指引。

## 3. 代码质量与重构 (Refactoring & Quality)
- [ ] **存储抽象**：将 `localStorage` 操作封装为统一的存储服务，为未来切换到 `chrome.storage` 做准备。
- [ ] **样式模块化**：整理 `styles.css`，采用更规范的 BEM 或变量管理方式。