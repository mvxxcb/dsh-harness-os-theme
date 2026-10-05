# dsh-harness-os-theme

**HARNESS OS —— 给 DeepSeek Harness Web UI 的暖纸白 + 橙色控制台主题包。**

> 暖纸白底 · `#ff7500` 橙色强调 · 近黑等宽标注 · 仪器面板质感。附浅色与深色两套同源配色。

[English](README.md) · 中文

---

## 这是什么

一个**纯客户端主题包**：只做一件事 —— 把 DSH 的 `--dsw-*` 设计令牌重映射成 HARNESS OS 的配色，让整个界面（会话、侧栏、代码块、diff、气泡、滚动条、设置页）一致地变成暖纸白 / 近黑的仪器面板观感。

- **不改 DSH 源码**，不替换任何组件，不注入 DOM 结构（除一个可关闭的轻量装饰样式表）。
- **零依赖、零构建授权**：`lib/client.js` 是提交进仓库的产物，安装时不需要跑任何构建脚本。
- **可完全撤销**：停用或卸载时逐条还原令牌，不留残留。
- 自动跟随宿主的明暗切换，也可手动锁定浅色/深色。

## 安装

```sh
# 从 GitHub 直接安装
dsh plugin --profile <你的profile> add github:mvxxcb/dsh-harness-os-theme

# 或先克隆再本地安装
git clone https://github.com/mvxxcb/dsh-harness-os-theme
dsh plugin --profile <你的profile> add ./dsh-harness-os-theme
```

> `<你的profile>` 通常是 `web` 或 `desktop`（取决于你用哪个 profile 跑 DSH Web 界面）。

装完**重启 DSH**（host 半新增了一个 loader 行），再刷新页面。

卸载：

```sh
dsh plugin --profile <你的profile> remove dsh-harness-os-theme
```

## 使用

**设置 → 通用 → HARNESS OS 主题**：

| 控件 | 说明 |
|---|---|
| 启用主题 | 总开关。关掉即完全还原宿主原色 |
| 明暗 | `跟随宿主` / `浅色` / `深色` |
| 仪器装饰层 | 轻量装饰（卡片圆角等）。锚点不存在时不命中，不影响布局 |

选择存在浏览器 `localStorage`，重启后保留。

## 兼容性

| 项 | 说明 |
|---|---|
| 平台 | DSH Web 界面（`platform: web`） |
| 宿主版本 | 在 **DSH 0.2.0-rc.2** 上开发与验证 |
| peer 声明 | **刻意不声明任何 `@deepseek-ai/dsh-*` peerDependency** —— DSH 的启动期兼容预检会检查这些 peer，范围不满足会**静默禁用整个 profile 行**。本插件只读稳定公开服务（`theme` / `slots` / `locale`），没有版本耦合，因此不声明即不会被版本线卡住 |

## 项目结构

```
themes/*.json                ← 主题数据（唯一事实来源）
src/client.template.js       ← 客户端模板（含唯一占位符）
scripts/build-client.mjs     ← 生成器：数据 → lib/client.js
scripts/check-theme-sync.mjs ← 门禁：产物是否漂移 + 契约是否完整
tests/smoke-client.mjs       ← 桩 DOM 冒烟测试（跑的是生成产物）
schema/theme.schema.json     ← 主题数据结构
lib/client.js                ← 生成产物（已提交）
lib/index.js                 ← host 半：空插件，仅为满足加载器
docs/DESIGN.md               ← 设计说明：取色、令牌体系、启动安全、踩坑记录
```

## 开发

```sh
node scripts/build-client.mjs      # 改完 themes/*.json 后重新生成 lib/client.js
node scripts/check-theme-sync.mjs  # 提交前门禁：产物一致性 + 14 个契约令牌全覆盖
node tests/smoke-client.mjs        # 桩 DOM 冒烟测试：注册形状 / 令牌应用 / 撤销 / 启动安全

# 或一把跑完
npm run verify
```

**改主题请改 `themes/*.json`，不要直接改 `lib/client.js`** —— 那个文件是生成的，门禁会检查它与数据源是否逐字节一致。

### 新增一套主题

在 `themes/` 加一个 JSON 数组（结构见 `schema/theme.schema.json`），跑到 14 个契约令牌全覆盖、双值齐备，然后重新生成并跑门禁。

## 设计说明

取色来源、DSH 令牌体系（423 个 `--dsw-*`）、客户端模块形状、启动安全对策、踩过的坑，都写在 **[docs/DESIGN.md](docs/DESIGN.md)**。

## License

[MIT](LICENSE)
