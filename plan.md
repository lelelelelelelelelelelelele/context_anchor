明白了，这次我完全理解了：您需要的是**“多 Provider（服务商）管理系统”**。

您手动输入 `modelname`（默认为 `gemini`），但希望能够预设**多组 API Key + Base URL**。在对话前或设置中，您可以自由切换当前使用的是哪一组配置。

以下是针对这一逻辑的深度重构方案：

### 1. 修改 HTML 结构：增加 Provider 切换与管理
我们将设置区域改为“配置列表 + 编辑区”的模式。

**修改 `sidepanel.html` `[F7:31-45]`：**
```html
[F7:31]|         <div class="settings">
[F7:31.1]|          <div class="provider-manager">
[F7:31.2]|            <select id="provider-select"></select>
[F7:31.3]|            <button id="add-provider" title="New Provider">+</button>
[F7:31.4]|            <button id="delete-provider" title="Delete Current">×</button>
[F7:31.5]|          </div>
[F7:32]|           <label>
[F7:33]|             API Key
[F7:34]|             <input id="api-key" type="password" placeholder="sk-..." />
[F7:35]|           </label>
[F7:36]|           <label>
[F7:37]|             Base URL
[F7:38]|             <input id="base-url" type="text" placeholder="https://api.openai.com" />
[F7:39]|           </label>
[F7:40]|           <label>
[F7:41]|             Model Name
[F7:42]|             <input id="model" type="text" placeholder="gemini-pro" />
[F7:43]|           </label>
[F7:44]|           <button id="save-settings">Save Provider</button>
[F7:45]|         </div>
```

### 2. 修改脚本逻辑：支持多配置存储
我们需要将原本的单配置改为数组存储。

**修改 `script.js` 中的常量与初始化 `[F5:3-8]`：**
```javascript
[F5:3]| const PROVIDERS_KEY = "rail_providers";
[F5:4]| const ACTIVE_PROVIDER_INDEX = "rail_current_provider_idx";
[F5:8]| const DEFAULT_MODEL = "gemini"; // 默认模型设为 gemini
[F5:8.1]| let providers = [];
[F5:8.2]| let currentProviderIdx = 0;
```

**重构 `loadSettings` 和 `saveSettings` `[F5:188-199]`：**
```javascript
[F5:188]| function loadSettings() {
[F5:188.1]|   const raw = localStorage.getItem(PROVIDERS_KEY);
[F5:188.2]|   providers = raw ? JSON.parse(raw) : [{ name: "Default", key: "", url: DEFAULT_BASE_URL, model: DEFAULT_MODEL }];
[F5:188.3]|   currentProviderIdx = Number(localStorage.getItem(ACTIVE_PROVIDER_INDEX)) || 0;
[F5:188.4]|   renderProviderOptions();
[F5:188.5]|   fillSettingsFields();
[F5:189]| }
[F5:190]| 
[F5:191]| function renderProviderOptions() {
[F5:191.1]|   const select = document.getElementById("provider-select");
[F5:191.2]|   select.innerHTML = providers.map((p, i) => `<option value="${i}" ${i === currentProviderIdx ? 'selected' : ''}>${p.name || ('Config ' + i)}</option>`).join('');
[F5:191.3]| }
[F5:192]| 
[F5:193]| function fillSettingsFields() {
[F5:193.1]|   const p = providers[currentProviderIdx];
[F5:193.2]|   apiKeyInput.value = p.key || "";
[F5:193.3]|   baseUrlInput.value = p.url || DEFAULT_BASE_URL;
[F5:193.4]|   modelInput.value = p.model || DEFAULT_MODEL;
[F5:193.5]| }
[F5:194]| 
[F5:195]| function saveSettings() {
[F5:195.1]|   const p = providers[currentProviderIdx];
[F5:195.2]|   p.key = apiKeyInput.value.trim();
[F5:195.3]|   p.url = baseUrlInput.value.trim();
[F5:195.4]|   p.model = modelInput.value.trim();
[F5:195.5]|   localStorage.setItem(PROVIDERS_KEY, JSON.stringify(providers));
[F5:195.6]|   localStorage.setItem(ACTIVE_PROVIDER_INDEX, currentProviderIdx);
[F5:195.7]|   renderProviderOptions();
[F5:196]| }
```

**增加 Provider 切换监听 `[F5:338]` 之后：**
```javascript
[F5:338.1]| document.getElementById("provider-select").addEventListener("change", (e) => {
[F5:338.2]|   currentProviderIdx = Number(e.target.value);
[F5:338.3]|   fillSettingsFields();
[F5:338.4]|   localStorage.setItem(ACTIVE_PROVIDER_INDEX, currentProviderIdx);
[F5:338.5]| });
[F5:338.6]| 
[F5:338.7]| document.getElementById("add-provider").addEventListener("click", () => {
[F5:338.8]|   const name = prompt("Provider Name:", "New Config");
[F5:338.9]|   if (name) {
[F5:338.10]|    providers.push({ name, key: "", url: DEFAULT_BASE_URL, model: DEFAULT_MODEL });
[F5:338.11]|    currentProviderIdx = providers.length - 1;
[F5:338.12]|    saveSettings();
[F5:338.13]|   }
[F5:338.14]| });
```

### 3. 修改 CSS：适配新的设置界面
由于设置项增多，我们需要让 `settings` 区域更规整。

**修改 `styles.css` `[F8:166-175]`：**
```css
[F8:166]| .settings {
[F8:167]|   display: none;
[F8:168]|   flex-direction: column; /* 改为垂直排列 */
[F8:169]|   gap: 12px;
[F8:170]|   background: var(--bg);
[F8:171]|   padding: 12px;
[F8:172]|   border: 1px solid var(--border);
[F8:173]|   border-radius: 8px;
[F8:174]| }
[F8:174.1]| .provider-manager {
[F8:174.2]|   display: flex;
[F8:174.3]|   gap: 4px;
[F8:174.4]| }
[F8:174.5]| .provider-manager select { flex: 1; background: var(--panel); color: var(--text); border: 1px solid var(--border); border-radius: 4px; }
```

### 4. 修复图标 (补充)
**修改 `sidepanel.html` `[F7:28]`：**
```html
[F7:28]| <span class="settings-icon" aria-hidden="true">&#9881;</span>
```

### 这样修改后的工作流：
1.  **管理**：您可以点击 `+` 创建“我的 Gemini 官方”、“我的 转发 API”等多个条目。
2.  **选择**：通过下拉菜单切换当前活跃的 Provider，下面的 Key 和 URL 会自动同步切换。
3.  **发送**：`sendChat` 函数会自动使用 `providers[currentProviderIdx]` 里的数据。
4.  **模型**：`Model Name` 依然是一个普通的 `input`，您可以随时改成 `gemini-1.5-pro` 或任何您需要的名称。

**您觉得这个“多条目管理”方案是否符合您“自行选择”的需求？**