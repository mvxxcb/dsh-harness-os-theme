# 设计说明 · DESIGN

本文记录这套主题的**来源、DSH 主题系统的代码设计、本仓库的架构决策**，以及踩过的坑。
它是给未来维护者（包括未来的你）看的工程记录，不是使用说明。

---

## 1. 视觉来源

主题取自一张 DSH 界面参考图，用脚本对像素直接取色（Pillow，量化后取众数＋按 HSV 饱和度高值筛强调色族）：

| 角色 | 取样值 | 落到的令牌 |
|---|---|---|
| 页面底 | `#efedea`（暖纸白） | `--dsw-alias-bg-base` |
| 侧栏 / 主画布 | `#eeece9` ~ `#efedea` | `--dsw-specific-sidebar-fill`、`--dsw-alias-bg-module-platform` |
| 抬升面（输入卡、卡片） | `#f4f3f1` | `--dsw-alias-bg-layer-1`、`--dsw-alias-settings-card-fill` |
| 主文字 | `#151514` / `#000000` | `--dsw-alias-label-primary` |
| **强调色** | **`#ff7500`**（取样 `#fe7400`/`#fc7100`/`#fc7c02`） | `--dsw-alias-brand-primary` |
| 强调浅调 | `#fbc081`、`#f89743` | `--dsw-alias-state-warn-secondary` 等 |

设计语言概括为「**暖纸白底 + 橙色强调 + 近黑标注 + 仪器面板**」。深色变体（`harness-os-dark`）不是简单反相，而是**同源的暖黑**（`#141311` 系），保证两层观感同族。

> 强调色恰好等于 DSH 自带品牌的橙色档（`#ff7500`），因此这套主题几乎不改变品牌识别，只改底色与文字温度。

---

## 2. DSH 主题系统的代码设计（学到的部分）

### 2.1 令牌体系

DSH 前端暴露 **423 个 `--dsw-*` 自定义属性**，分四层：

| 前缀 | 含义 | 例 |
|---|---|---|
| `--dsw-alias-*` | 语义层，组件实际消费 | `bg-base`、`label-primary`、`brand-primary`、`state-error-primary` |
| `--dsw-static-*` | 原始色板（alias 的取值来源） | `neutral-bluish-00…1000`、`deepseek-500`、`red-600` |
| `--dsw-font-*` | 排版标度（family/size/weight/line-height） | `font-family`、`font-l-20`、`font-base-16` |
| `--dsw-elevation-*` / `--dsw-specific-*` | 阴影、局部专用填充 | `elevation-panel`、`specific-sidebar-fill` |

**做主题只需覆盖 `--dsw-alias-*`**（必要时补 `--dsw-specific-*`），不要碰 `--dsw-static-*` —— 后者是调色板的原料，改它会影响所有引用它的语义令牌，难以预测。

### 2.2 契约令牌（14 个）

运行中的 `theme` 服务只强制 14 个令牌，且**每个都要求同时给出 light 与 dark 值**：

```
--dsw-alias-bg-base              --dsw-alias-border-l1
--dsw-alias-bg-layer-1           --dsw-alias-border-l2
--dsw-alias-bg-layer-2           --dsw-alias-brand-primary
--dsw-alias-bg-overlay           --dsw-alias-label-primary
--dsw-alias-state-error-primary  --dsw-alias-label-secondary
--dsw-alias-state-idle-primary   --dsw-alias-state-success-primary
--dsw-alias-state-warn-primary   --dsw-specific-sidebar-fill
```

只覆盖这几个主题也能"看起来生效"，但会在细节处露馅（滚动条、代码块、diff、气泡都还是原色）。所以本仓库的做法是：**契约 14 个必修，其余按语义成组覆盖**，共 103 个令牌/主题。

### 2.3 客户端模块的形状

DSH 的 Web 插件客户端是一个**自包含 bundle**，由 client-modules 以一条 URL 下发，用全局加载器注册：

```js
window.__ModuleLoader__.load({
  id: 'dsh-harness-os-theme',
  factory: (require) => {
    var module = { exports: {} }; var exports = module.exports;
    var React = require('react');          // 只有渲染设置行时才需要
    exports.apply = function (ctx) { … };  // ctx.get('theme' | 'slots' | 'locale')
    exports.inject = ['slots', 'theme', 'locale'];
    return module.exports;
  }
});
```

要点：

- **`factory` 是 CommonJS 风格**：靠 `require` 取运行时依赖。bundle 内不能 import 兄弟文件，这决定了主题数据必须**编译进 bundle**。
- **`exports.inject` 是服务依赖声明**，不是 package.json 的 `dsh.client.inject`。
- 明暗判定：`ctx.get('theme').getTheme().active.colorScheme`。
- 应用方式：`document.documentElement.style.setProperty('--dsw-…', value, 'important')`。
- 设置行：`slots.inject('settings.general.item', () => slots.register({ name, id, order }, () => ReactElement))`。

---

## 3. 本仓库的架构

```
themes/*.json            ← 数据源（唯一事实来源）
src/client.template.js   ← 客户端源码模板，含唯一占位符
scripts/build-client.mjs ← 生成器：把主题数据注入模板 → lib/client.js
scripts/check-theme-sync.mjs ← 门禁：产物是否漂移 + 契约是否完整
lib/client.js            ← 生成产物（提交进仓库）
lib/index.js             ← host 半：空插件，仅为满足加载器
```

**为什么是"生成 + 校验"而不是运行时读取**：客户端 bundle 是单个自包含文件，浏览器里既不能 import 兄弟模块也读不到磁盘 JSON。数据必须编译进去。既然必须编译，就必须有一个**防漂移门禁** —— 否则有人手改了 `lib/client.js` 而没改数据源，两者会静默分叉。

`pnpm check` 做四件事：产物逐字节比对、id 唯一性、`colorScheme` 合法性、**每个主题 14/14 契约令牌全覆盖且双值齐备**。

另有 `tests/smoke-client.mjs`：用桩 `window`/`document`/React 在 Node 里**真跑一遍 `lib/client.js`**，断言注册形状、工厂阶段已应用令牌（防闪烁）、深色宿主选对深色套、设置行已注册、卸载后逐条撤销干净、以及**宿主服务全缺失时不抛错**（启动安全）。15 条断言，`npm run verify` 一把跑完。

### 3.1 踩过的坑：装饰样式表按引用删除会在 HMR 后漏删

第一版 `applyDecor` 只维护一个本地 `decorEl` 引用，删除时靠 `decorEl.parentNode`。冒烟测试第一次跑就红了 —— 因为桩 DOM 没有自动设置 `parentNode`。但顺着查下去发现这不只是桩的问题：**客户端 HMR 会重新求值本模块**，此时本地引用归零而 DOM 里旧的 `<style>` 还在，于是会插入第二个、且旧的永远删不掉。

改为**按 id 查找**（`document.getElementById`）后天然幂等：加之前先查、删之前也按 id 查。这个缺陷是测试抓出来的，不是猜出来的。

### 3.1 踩过的坑：占位符出现在注释里

第一版模板的头部注释里写了占位符字面量，导致 `String.replace` 命中了**注释**而不是代码：JSON 被注进注释、把注释撑破成代码（语法错误），而真正的 `var THEMES = __HOS_THEMES__` 仍是未定义标识符。

修法是两条并用：
1. 注释里不再写出占位符字面量；
2. 生成器断言**占位符恰好出现 1 次**，否则直接报错。

这条约束现在是永久的 —— 任何"看起来生成成功、实际注入错位"的变体都会被拦下。

---

## 4. 启动安全（Boot safety）

主题插件在**启动期**执行，一段抛错的代码可能让整个 Web UI 白屏。本仓库的对策：

| 措施 | 位置 |
|---|---|
| 工厂体内所有外部调用（`require`、`localStorage`、`matchMedia`、DOM）都各自 try/catch | `lib/client.js` |
| `render()` 整体再包一层 try/catch，**绝不向外抛** | `render()` |
| 拿不到 `theme`/`slots`/`locale` 时降级：主题照常生效，只少设置行/自动跟随 | `apply()` |
| 单个令牌写失败不影响其余令牌 | `applyTokens()` |
| 卸载时逐条 `removeProperty` 并移除装饰样式表，不留残留 | `ctx.effect` 清理函数 |
| 不声明 `@deepseek-ai/dsh-*` peer，避免启动期预检把整行静默禁用 | `package.json` |

> 最后一条值得展开：DSH 自某个版本起把 **peerDependencies 当作启动期硬约束**，范围不满足就把整个 profile 行 `row.disabled = true`，且只在 stderr 留一行 —— 表现为"插件装上了但完全没反应"。本插件只读稳定公开服务，没有版本耦合，因此**刻意不声明**这些 peer。

---

## 5. 防闪烁

主题在 `apply(ctx)` 里应用时，React 首帧可能已经画完，会出现一瞬原色。

对策：**在 `factory` 求值阶段就先应用一次**（此时早于首帧），用 `localStorage` 里上次的选择；`auto` 模式下先用 `prefers-color-scheme` 近似，等 `theme` 服务可用后再用真实 `colorScheme` 校正。

首次安装仍可能有一次闪烁（本地还没有任何偏好）—— 这是纯客户端方案的理论下限，除非把偏好搬到 host 侧做启动注入。

---

## 6. 如何新增一套主题

1. 在 `themes/` 新建或编辑一个 `*.json`（数组，元素结构见 `schema/theme.schema.json`）。
2. 跑到 14 个契约令牌全覆盖、双值齐备。
3. `node scripts/build-client.mjs` 重新生成。
4. `node scripts/check-theme-sync.mjs` 确认门禁通过。
5. 提交 `themes/*.json` 与 `lib/client.js` **一起**。

多套主题会被生成器按文件名字典序合并，输出稳定、可复现。

---

## 7. 同类项目（调研时参考的代码设计）

| 项目 | 可借鉴之处 |
|---|---|
| [dsh-theme-gallery](https://github.com/renjie2026/dsh-theme-gallery) | JSON 数据驱动主题、`embed-themes.mjs` 生成器、`BOOT-SAFETY.md`、大量 `check-*.mjs` 守卫 |
| [dsh-protect-eyes-skin](https://github.com/CynicismBoyJYD/dsh-protect-eyes-skin) | 全量 `--dsw-*` 令牌重映射，浅深双套 |
| [my-skin-for-DeepSeek-Harness](https://github.com/EphoReal/my-skin-for-DeepSeek-Harness) | 皮肤插件的包结构 |
| [dsh-skin](https://github.com/Highjobop/dsh-gadgets) | **最小可读的客户端模块范例**：`window.__ModuleLoader__.load` 形状、13 个令牌角色、`slots` 设置行、locale 双语 |
| [dsh-custom-brand](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) | 品牌区替换（logo/字标） |
| [Lafeng-UI](https://github.com/JimingYang25/Lafeng-UI-A-snazzy-personalized-custom-UI-plugin-for-DeepSeek-Harness-Cordis) | 个性化 UI 插件的组织方式 |

本仓库的客户端模块形状直接对齐 **dsh-skin**（最小、最易读），数据驱动的构建/校验思路对齐 **dsh-theme-gallery**。
