// dsh-harness-os-theme — Web client half (browser bundle).
//
// 本文件是**模板**：`scripts/build-client.mjs` 会把 themes/*.json 的数据注入到
// 下方那个主题数据占位符，生成 `lib/client.js`。请勿直接编辑 lib/client.js
// 里的主题数据 —— 改 themes/*.json 再跑生成器，否则 `pnpm check` 会失败。
//
// 注意：本注释刻意不写出占位符字面量。占位符若在注释里也出现一次，
// 生成器的字符串替换会命中注释而不是代码（这个坑已经踩过一次）。
//
// 设计要点
//   1. 纯客户端插件：只读 `theme` / `slots` / `locale` 三个公开服务，
//      把结果写成 `document.documentElement` 上的 CSS 自定义属性。
//   2. **启动安全优先**：整个工厂函数包在 try/catch 里。主题在启动期执行，
//      一旦抛错可能白屏 —— 所以任何一步失败都只是「主题没生效」，绝不阻断宿主。
//   3. 防闪烁：工厂求值时就先按上次选择应用一次（早于 React 首帧），
//      `apply(ctx)` 里再用主题服务给出的真实 colorScheme 校正。
//   4. 可完全撤销：停用或卸载时逐条 removeProperty，并移除装饰样式表，
//      不给宿主留下任何残留。
window.__ModuleLoader__.load({
  id: 'dsh-harness-os-theme',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    // React 只有在渲染设置行时才需要；拿不到也不影响主题生效。
    var React = null;
    try { React = require('react'); } catch (e) { /* 无 react 时仅失去设置行 */ }

    /* THEME-DATA-BEGIN — 由 scripts/build-client.mjs 从 themes/*.json 注入 */
    var THEMES = [
      {
        "id": "harness-os-light",
        "label": "HARNESS OS · 暖纸",
        "description": "暖纸白底、橙色强调、近黑等宽标注 —— 取自 HARNESS OS 控制台视觉。浅色。",
        "colorScheme": "light",
        "tokens": {
          "--dsw-alias-bg-base": {
            "light": "#efedea",
            "dark": "#efedea"
          },
          "--dsw-alias-bg-layer-1": {
            "light": "#f4f3f1",
            "dark": "#f4f3f1"
          },
          "--dsw-alias-bg-layer-2": {
            "light": "#f8f7f5",
            "dark": "#f8f7f5"
          },
          "--dsw-alias-bg-layer-3": {
            "light": "#fbfaf9",
            "dark": "#fbfaf9"
          },
          "--dsw-alias-bg-overlay": {
            "light": "#f8f7f5",
            "dark": "#f8f7f5"
          },
          "--dsw-alias-bg-skeleton": {
            "light": "#1515140f",
            "dark": "#1515140f"
          },
          "--dsw-alias-bg-module-platform": {
            "light": "#eae7e3",
            "dark": "#eae7e3"
          },
          "--dsw-alias-bg-multi-select": {
            "light": "#eae7e3",
            "dark": "#eae7e3"
          },
          "--dsw-alias-border-l1": {
            "light": "#15151412",
            "dark": "#15151412"
          },
          "--dsw-alias-border-l2": {
            "light": "#1515141f",
            "dark": "#1515141f"
          },
          "--dsw-alias-border-l3": {
            "light": "#1515142b",
            "dark": "#1515142b"
          },
          "--dsw-alias-border-l4": {
            "light": "#15151438",
            "dark": "#15151438"
          },
          "--dsw-alias-brand-primary": {
            "light": "#ff7500",
            "dark": "#ff7500"
          },
          "--dsw-alias-brand-primary-invert": {
            "light": "#ffffff",
            "dark": "#ffffff"
          },
          "--dsw-alias-brand-text": {
            "light": "#c95600",
            "dark": "#c95600"
          },
          "--dsw-alias-label-primary": {
            "light": "#151514",
            "dark": "#151514"
          },
          "--dsw-alias-label-primary-bluish": {
            "light": "#151514",
            "dark": "#151514"
          },
          "--dsw-alias-label-secondary": {
            "light": "#5c5852",
            "dark": "#5c5852"
          },
          "--dsw-alias-label-tertiary": {
            "light": "#837e77",
            "dark": "#837e77"
          },
          "--dsw-alias-label-caption": {
            "light": "#9a948c",
            "dark": "#9a948c"
          },
          "--dsw-alias-label-dimmed": {
            "light": "#b3aca3",
            "dark": "#b3aca3"
          },
          "--dsw-alias-label-primary-dimmed": {
            "light": "#5c5852",
            "dark": "#5c5852"
          },
          "--dsw-alias-label-primary-foreground": {
            "light": "#ffffff",
            "dark": "#ffffff"
          },
          "--dsw-alias-label-primary-inverted": {
            "light": "#ffffff",
            "dark": "#ffffff"
          },
          "--dsw-alias-label-error": {
            "light": "#d93a2b",
            "dark": "#d93a2b"
          },
          "--dsw-alias-link": {
            "light": "#c95600",
            "dark": "#c95600"
          },
          "--dsw-alias-state-error-primary": {
            "light": "#d93a2b",
            "dark": "#d93a2b"
          },
          "--dsw-alias-state-error-secondary": {
            "light": "#e8735f",
            "dark": "#e8735f"
          },
          "--dsw-alias-state-idle-primary": {
            "light": "#b8b1a8",
            "dark": "#b8b1a8"
          },
          "--dsw-alias-state-success-primary": {
            "light": "#2f8f5b",
            "dark": "#2f8f5b"
          },
          "--dsw-alias-state-success-secondary": {
            "light": "#5aab7c",
            "dark": "#5aab7c"
          },
          "--dsw-alias-state-success-tertiary": {
            "light": "#dff0e6",
            "dark": "#dff0e6"
          },
          "--dsw-alias-state-warn-primary": {
            "light": "#d98a00",
            "dark": "#d98a00"
          },
          "--dsw-alias-state-warn-secondary": {
            "light": "#e8a63d",
            "dark": "#e8a63d"
          },
          "--dsw-alias-state-warn-tertiary": {
            "light": "#fbf0dc",
            "dark": "#fbf0dc"
          },
          "--dsw-alias-state-warn-label": {
            "light": "#a86a00",
            "dark": "#a86a00"
          },
          "--dsw-alias-state-business-primary": {
            "light": "#ff7500",
            "dark": "#ff7500"
          },
          "--dsw-alias-state-business-tertiary": {
            "light": "#ffe8d1",
            "dark": "#ffe8d1"
          },
          "--dsw-alias-interactive-bg-hover": {
            "light": "#ff750014",
            "dark": "#ff750014"
          },
          "--dsw-alias-interactive-bg-active": {
            "light": "#ff750024",
            "dark": "#ff750024"
          },
          "--dsw-alias-interactive-bg-hover-accent": {
            "light": "#ff750024",
            "dark": "#ff750024"
          },
          "--dsw-alias-interactive-bg-hover-solid": {
            "light": "#eae7e3",
            "dark": "#eae7e3"
          },
          "--dsw-alias-interactive-bg-hover-danger": {
            "light": "#d93a2b0d",
            "dark": "#d93a2b0d"
          },
          "--dsw-alias-markdown-code-block": {
            "light": "#e9e6e2",
            "dark": "#e9e6e2"
          },
          "--dsw-alias-markdown-code-block-banner": {
            "light": "#e4e1dc",
            "dark": "#e4e1dc"
          },
          "--dsw-alias-markdown-inline-code": {
            "light": "#e9e6e2",
            "dark": "#e9e6e2"
          },
          "--dsw-alias-markdown-tag": {
            "light": "#eae7e3",
            "dark": "#eae7e3"
          },
          "--dsw-alias-markdown-citation": {
            "light": "#eae7e3",
            "dark": "#eae7e3"
          },
          "--dsw-alias-markdown-placeholder": {
            "light": "#b3aca3",
            "dark": "#b3aca3"
          },
          "--dsw-alias-markdown-code-segment-selected": {
            "light": "#fbfaf9",
            "dark": "#fbfaf9"
          },
          "--dsw-alias-markdown-code-segment-unselected": {
            "light": "#e9e6e2",
            "dark": "#e9e6e2"
          },
          "--dsw-alias-turn-trigger-bg": {
            "light": "#e9e6e2",
            "dark": "#e9e6e2"
          },
          "--dsw-alias-turn-trigger-bg-hover": {
            "light": "#ff750014",
            "dark": "#ff750014"
          },
          "--dsw-alias-scrollbar-bg-l1": {
            "light": "#1515141a",
            "dark": "#1515141a"
          },
          "--dsw-alias-scrollbar-bg-l2": {
            "light": "#1515141a",
            "dark": "#1515141a"
          },
          "--dsw-alias-scrollbar-hover-l1": {
            "light": "#15151433",
            "dark": "#15151433"
          },
          "--dsw-alias-scrollbar-hover-l2": {
            "light": "#15151433",
            "dark": "#15151433"
          },
          "--dsw-alias-tooltip-bg": {
            "light": "#2b2926",
            "dark": "#2b2926"
          },
          "--dsw-alias-tooltip-key-bg": {
            "light": "#413e3a",
            "dark": "#413e3a"
          },
          "--dsw-alias-toast-bg": {
            "light": "#2b2926",
            "dark": "#2b2926"
          },
          "--dsw-alias-toast-label": {
            "light": "#f4f3f1",
            "dark": "#f4f3f1"
          },
          "--dsw-alias-settings-card-fill": {
            "light": "#f4f3f1",
            "dark": "#f4f3f1"
          },
          "--dsw-alias-settings-card-stroke": {
            "light": "#15151438",
            "dark": "#15151438"
          },
          "--dsw-alias-menu-group-header-fill": {
            "light": "#f4f3f1f0",
            "dark": "#f4f3f1f0"
          },
          "--dsw-alias-menu-icon": {
            "light": "#5c5852",
            "dark": "#5c5852"
          },
          "--dsw-alias-switch-thumb": {
            "light": "#ffffff",
            "dark": "#ffffff"
          },
          "--dsw-alias-button-primary-fill": {
            "light": "#ff7500",
            "dark": "#ff7500"
          },
          "--dsw-alias-button-primary-hover": {
            "light": "#e86a00",
            "dark": "#e86a00"
          },
          "--dsw-alias-button-primary-dimmed": {
            "light": "#ff750029",
            "dark": "#ff750029"
          },
          "--dsw-alias-button-elevated-fill": {
            "light": "#fbfaf9",
            "dark": "#fbfaf9"
          },
          "--dsw-alias-button-floating-fill": {
            "light": "#fbfaf9",
            "dark": "#fbfaf9"
          },
          "--dsw-alias-button-floating-hover": {
            "light": "#f4f3f1",
            "dark": "#f4f3f1"
          },
          "--dsw-alias-button-contrast-fill": {
            "light": "#151514",
            "dark": "#151514"
          },
          "--dsw-alias-button-ghost-active-fill": {
            "light": "#eae7e3",
            "dark": "#eae7e3"
          },
          "--dsw-alias-button-ghost-active-hover": {
            "light": "#e4e1dc",
            "dark": "#e4e1dc"
          },
          "--dsw-alias-button-ghost-active-border": {
            "light": "#15151438",
            "dark": "#15151438"
          },
          "--dsw-alias-code-diff-added": {
            "light": "#2f8f5b1f",
            "dark": "#2f8f5b1f"
          },
          "--dsw-alias-code-diff-deleted": {
            "light": "#d93a2b1f",
            "dark": "#d93a2b1f"
          },
          "--dsw-alias-file-diff-added-bg": {
            "light": "#e6f1e9",
            "dark": "#e6f1e9"
          },
          "--dsw-alias-file-diff-added-gutter": {
            "light": "#edf5f0",
            "dark": "#edf5f0"
          },
          "--dsw-alias-file-diff-added-marker": {
            "light": "#2f8f5b",
            "dark": "#2f8f5b"
          },
          "--dsw-alias-file-diff-deleted-bg": {
            "light": "#f7e6e3",
            "dark": "#f7e6e3"
          },
          "--dsw-alias-file-diff-deleted-gutter": {
            "light": "#faedeb",
            "dark": "#faedeb"
          },
          "--dsw-alias-file-diff-deleted-marker": {
            "light": "#c33a2c",
            "dark": "#c33a2c"
          },
          "--dsw-alias-bg-mask-1": {
            "light": "#0000003d",
            "dark": "#0000003d"
          },
          "--dsw-alias-bg-mask-2": {
            "light": "#0000001f",
            "dark": "#0000001f"
          },
          "--dsw-alias-bg-mask-3": {
            "light": "#0000007a",
            "dark": "#0000007a"
          },
          "--dsw-alias-bg-mask-drop": {
            "light": "#fbfaf9b3",
            "dark": "#fbfaf9b3"
          },
          "--dsw-alias-bg-mask-photo": {
            "light": "#000000e0",
            "dark": "#000000e0"
          },
          "--dsw-alias-bg-document-preview": {
            "light": "#fbfaf9",
            "dark": "#fbfaf9"
          },
          "--dsw-alias-label-document-preview": {
            "light": "#5c5852",
            "dark": "#5c5852"
          },
          "--dsw-alias-bg-document-selection": {
            "light": "#ff750033",
            "dark": "#ff750033"
          },
          "--dsw-alias-onboarding-accent": {
            "light": "#ff7500",
            "dark": "#ff7500"
          },
          "--dsw-alias-onboarding-card-fill": {
            "light": "#f8f7f5",
            "dark": "#f8f7f5"
          },
          "--dsw-alias-onboarding-secondary-fill": {
            "light": "#fbfaf9",
            "dark": "#fbfaf9"
          },
          "--dsw-alias-onboarding-checkbox-border": {
            "light": "#15151433",
            "dark": "#15151433"
          },
          "--dsw-alias-button-tool-bar-fill": {
            "light": "#54555780",
            "dark": "#54555780"
          },
          "--dsw-alias-button-tool-bar-hover": {
            "light": "#54555799",
            "dark": "#54555799"
          },
          "--dsw-alias-button-tool-bar-fill-invisible": {
            "light": "#1f1f1f5c",
            "dark": "#1f1f1f5c"
          },
          "--dsw-specific-sidebar-fill": {
            "light": "#eae7e3",
            "dark": "#eae7e3"
          },
          "--dsw-elevation-stroke-color": {
            "light": "#1515141f",
            "dark": "#1515141f"
          },
          "--dsw-focus-ring-color": {
            "light": "#ff750080",
            "dark": "#ff750080"
          },
          "--dsw-desktop-window-tint": {
            "light": "#ffffff66",
            "dark": "#ffffff66"
          }
        }
      },
      {
        "id": "harness-os-dark",
        "label": "HARNESS OS · 墨夜",
        "description": "暖黑底、橙色强调 —— 与浅色同源的深色变体，供夜间使用。",
        "colorScheme": "dark",
        "tokens": {
          "--dsw-alias-bg-base": {
            "light": "#141311",
            "dark": "#141311"
          },
          "--dsw-alias-bg-layer-1": {
            "light": "#1c1a17",
            "dark": "#1c1a17"
          },
          "--dsw-alias-bg-layer-2": {
            "light": "#242220",
            "dark": "#242220"
          },
          "--dsw-alias-bg-layer-3": {
            "light": "#2c2926",
            "dark": "#2c2926"
          },
          "--dsw-alias-bg-overlay": {
            "light": "#242220",
            "dark": "#242220"
          },
          "--dsw-alias-bg-skeleton": {
            "light": "#ffffff0f",
            "dark": "#ffffff0f"
          },
          "--dsw-alias-bg-module-platform": {
            "light": "#1c1a17",
            "dark": "#1c1a17"
          },
          "--dsw-alias-bg-multi-select": {
            "light": "#242220",
            "dark": "#242220"
          },
          "--dsw-alias-border-l1": {
            "light": "#ffffff12",
            "dark": "#ffffff12"
          },
          "--dsw-alias-border-l2": {
            "light": "#ffffff1f",
            "dark": "#ffffff1f"
          },
          "--dsw-alias-border-l3": {
            "light": "#ffffff2b",
            "dark": "#ffffff2b"
          },
          "--dsw-alias-border-l4": {
            "light": "#ffffff38",
            "dark": "#ffffff38"
          },
          "--dsw-alias-brand-primary": {
            "light": "#ff8a2b",
            "dark": "#ff8a2b"
          },
          "--dsw-alias-brand-primary-invert": {
            "light": "#141311",
            "dark": "#141311"
          },
          "--dsw-alias-brand-text": {
            "light": "#ffa257",
            "dark": "#ffa257"
          },
          "--dsw-alias-label-primary": {
            "light": "#f2efe9",
            "dark": "#f2efe9"
          },
          "--dsw-alias-label-primary-bluish": {
            "light": "#f2efe9",
            "dark": "#f2efe9"
          },
          "--dsw-alias-label-secondary": {
            "light": "#c3bcb2",
            "dark": "#c3bcb2"
          },
          "--dsw-alias-label-tertiary": {
            "light": "#98918a",
            "dark": "#98918a"
          },
          "--dsw-alias-label-caption": {
            "light": "#8a837c",
            "dark": "#8a837c"
          },
          "--dsw-alias-label-dimmed": {
            "light": "#6f6963",
            "dark": "#6f6963"
          },
          "--dsw-alias-label-primary-dimmed": {
            "light": "#c3bcb2",
            "dark": "#c3bcb2"
          },
          "--dsw-alias-label-primary-foreground": {
            "light": "#141311",
            "dark": "#141311"
          },
          "--dsw-alias-label-primary-inverted": {
            "light": "#141311",
            "dark": "#141311"
          },
          "--dsw-alias-label-error": {
            "light": "#ff6b57",
            "dark": "#ff6b57"
          },
          "--dsw-alias-link": {
            "light": "#ffa257",
            "dark": "#ffa257"
          },
          "--dsw-alias-state-error-primary": {
            "light": "#ff6b57",
            "dark": "#ff6b57"
          },
          "--dsw-alias-state-error-secondary": {
            "light": "#e05543",
            "dark": "#e05543"
          },
          "--dsw-alias-state-idle-primary": {
            "light": "#5a544e",
            "dark": "#5a544e"
          },
          "--dsw-alias-state-success-primary": {
            "light": "#4fbf82",
            "dark": "#4fbf82"
          },
          "--dsw-alias-state-success-secondary": {
            "light": "#3d9e69",
            "dark": "#3d9e69"
          },
          "--dsw-alias-state-success-tertiary": {
            "light": "#1e3629",
            "dark": "#1e3629"
          },
          "--dsw-alias-state-warn-primary": {
            "light": "#f0a52e",
            "dark": "#f0a52e"
          },
          "--dsw-alias-state-warn-secondary": {
            "light": "#d98f1d",
            "dark": "#d98f1d"
          },
          "--dsw-alias-state-warn-tertiary": {
            "light": "#3a2e17",
            "dark": "#3a2e17"
          },
          "--dsw-alias-state-warn-label": {
            "light": "#f5c474",
            "dark": "#f5c474"
          },
          "--dsw-alias-state-business-primary": {
            "light": "#ff8a2b",
            "dark": "#ff8a2b"
          },
          "--dsw-alias-state-business-tertiary": {
            "light": "#3a2612",
            "dark": "#3a2612"
          },
          "--dsw-alias-interactive-bg-hover": {
            "light": "#ff8a2b1a",
            "dark": "#ff8a2b1a"
          },
          "--dsw-alias-interactive-bg-active": {
            "light": "#ff8a2b2b",
            "dark": "#ff8a2b2b"
          },
          "--dsw-alias-interactive-bg-hover-accent": {
            "light": "#ff8a2b2b",
            "dark": "#ff8a2b2b"
          },
          "--dsw-alias-interactive-bg-hover-solid": {
            "light": "#2c2926",
            "dark": "#2c2926"
          },
          "--dsw-alias-interactive-bg-hover-danger": {
            "light": "#ff6b5714",
            "dark": "#ff6b5714"
          },
          "--dsw-alias-markdown-code-block": {
            "light": "#1a1815",
            "dark": "#1a1815"
          },
          "--dsw-alias-markdown-code-block-banner": {
            "light": "#221f1c",
            "dark": "#221f1c"
          },
          "--dsw-alias-markdown-inline-code": {
            "light": "#2c2926",
            "dark": "#2c2926"
          },
          "--dsw-alias-markdown-tag": {
            "light": "#2c2926",
            "dark": "#2c2926"
          },
          "--dsw-alias-markdown-citation": {
            "light": "#242220",
            "dark": "#242220"
          },
          "--dsw-alias-markdown-placeholder": {
            "light": "#6f6963",
            "dark": "#6f6963"
          },
          "--dsw-alias-markdown-code-segment-selected": {
            "light": "#3a3632",
            "dark": "#3a3632"
          },
          "--dsw-alias-markdown-code-segment-unselected": {
            "light": "#221f1c",
            "dark": "#221f1c"
          },
          "--dsw-alias-turn-trigger-bg": {
            "light": "#1a1815",
            "dark": "#1a1815"
          },
          "--dsw-alias-turn-trigger-bg-hover": {
            "light": "#ff8a2b1a",
            "dark": "#ff8a2b1a"
          },
          "--dsw-alias-scrollbar-bg-l1": {
            "light": "#ffffff1f",
            "dark": "#ffffff1f"
          },
          "--dsw-alias-scrollbar-bg-l2": {
            "light": "#ffffff1f",
            "dark": "#ffffff1f"
          },
          "--dsw-alias-scrollbar-hover-l1": {
            "light": "#ffffff3d",
            "dark": "#ffffff3d"
          },
          "--dsw-alias-scrollbar-hover-l2": {
            "light": "#ffffff3d",
            "dark": "#ffffff3d"
          },
          "--dsw-alias-tooltip-bg": {
            "light": "#3a3632",
            "dark": "#3a3632"
          },
          "--dsw-alias-tooltip-key-bg": {
            "light": "#4d4842",
            "dark": "#4d4842"
          },
          "--dsw-alias-toast-bg": {
            "light": "#3a3632",
            "dark": "#3a3632"
          },
          "--dsw-alias-toast-label": {
            "light": "#f2efe9",
            "dark": "#f2efe9"
          },
          "--dsw-alias-settings-card-fill": {
            "light": "#1c1a17",
            "dark": "#1c1a17"
          },
          "--dsw-alias-settings-card-stroke": {
            "light": "#ffffff2b",
            "dark": "#ffffff2b"
          },
          "--dsw-alias-menu-group-header-fill": {
            "light": "#1c1a17f0",
            "dark": "#1c1a17f0"
          },
          "--dsw-alias-menu-icon": {
            "light": "#c3bcb2",
            "dark": "#c3bcb2"
          },
          "--dsw-alias-switch-thumb": {
            "light": "#f2efe9",
            "dark": "#f2efe9"
          },
          "--dsw-alias-button-primary-fill": {
            "light": "#ff8a2b",
            "dark": "#ff8a2b"
          },
          "--dsw-alias-button-primary-hover": {
            "light": "#ff9c4a",
            "dark": "#ff9c4a"
          },
          "--dsw-alias-button-primary-dimmed": {
            "light": "#ff8a2b29",
            "dark": "#ff8a2b29"
          },
          "--dsw-alias-button-elevated-fill": {
            "light": "#2c2926",
            "dark": "#2c2926"
          },
          "--dsw-alias-button-floating-fill": {
            "light": "#2c2926",
            "dark": "#2c2926"
          },
          "--dsw-alias-button-floating-hover": {
            "light": "#3a3632",
            "dark": "#3a3632"
          },
          "--dsw-alias-button-contrast-fill": {
            "light": "#f2efe9",
            "dark": "#f2efe9"
          },
          "--dsw-alias-button-ghost-active-fill": {
            "light": "#2c2926",
            "dark": "#2c2926"
          },
          "--dsw-alias-button-ghost-active-hover": {
            "light": "#3a3632",
            "dark": "#3a3632"
          },
          "--dsw-alias-button-ghost-active-border": {
            "light": "#ffffff38",
            "dark": "#ffffff38"
          },
          "--dsw-alias-code-diff-added": {
            "light": "#4fbf822b",
            "dark": "#4fbf822b"
          },
          "--dsw-alias-code-diff-deleted": {
            "light": "#ff6b572b",
            "dark": "#ff6b572b"
          },
          "--dsw-alias-file-diff-added-bg": {
            "light": "#17301f",
            "dark": "#17301f"
          },
          "--dsw-alias-file-diff-added-gutter": {
            "light": "#14291b",
            "dark": "#14291b"
          },
          "--dsw-alias-file-diff-added-marker": {
            "light": "#4fbf82",
            "dark": "#4fbf82"
          },
          "--dsw-alias-file-diff-deleted-bg": {
            "light": "#331a16",
            "dark": "#331a16"
          },
          "--dsw-alias-file-diff-deleted-gutter": {
            "light": "#2b1613",
            "dark": "#2b1613"
          },
          "--dsw-alias-file-diff-deleted-marker": {
            "light": "#ff6b57",
            "dark": "#ff6b57"
          },
          "--dsw-alias-bg-mask-1": {
            "light": "#0000005c",
            "dark": "#0000005c"
          },
          "--dsw-alias-bg-mask-2": {
            "light": "#00000033",
            "dark": "#00000033"
          },
          "--dsw-alias-bg-mask-3": {
            "light": "#00000099",
            "dark": "#00000099"
          },
          "--dsw-alias-bg-mask-drop": {
            "light": "#141311b3",
            "dark": "#141311b3"
          },
          "--dsw-alias-bg-mask-photo": {
            "light": "#000000e0",
            "dark": "#000000e0"
          },
          "--dsw-alias-bg-document-preview": {
            "light": "#1c1a17",
            "dark": "#1c1a17"
          },
          "--dsw-alias-label-document-preview": {
            "light": "#c3bcb2",
            "dark": "#c3bcb2"
          },
          "--dsw-alias-bg-document-selection": {
            "light": "#ff8a2b40",
            "dark": "#ff8a2b40"
          },
          "--dsw-alias-onboarding-accent": {
            "light": "#ff8a2b",
            "dark": "#ff8a2b"
          },
          "--dsw-alias-onboarding-card-fill": {
            "light": "#242220",
            "dark": "#242220"
          },
          "--dsw-alias-onboarding-secondary-fill": {
            "light": "#2c2926",
            "dark": "#2c2926"
          },
          "--dsw-alias-onboarding-checkbox-border": {
            "light": "#ffffff33",
            "dark": "#ffffff33"
          },
          "--dsw-alias-button-tool-bar-fill": {
            "light": "#54555780",
            "dark": "#54555780"
          },
          "--dsw-alias-button-tool-bar-hover": {
            "light": "#54555799",
            "dark": "#54555799"
          },
          "--dsw-alias-button-tool-bar-fill-invisible": {
            "light": "#1f1f1f5c",
            "dark": "#1f1f1f5c"
          },
          "--dsw-specific-sidebar-fill": {
            "light": "#191715",
            "dark": "#191715"
          },
          "--dsw-elevation-stroke-color": {
            "light": "#ffffff1f",
            "dark": "#ffffff1f"
          },
          "--dsw-focus-ring-color": {
            "light": "#ff8a2b80",
            "dark": "#ff8a2b80"
          },
          "--dsw-desktop-window-tint": {
            "light": "#00000066",
            "dark": "#00000066"
          }
        }
      }
    ];
    /* THEME-DATA-END */

    var SOURCE = 'dsh-harness-os-theme';
    var STORE_KEY = 'dsh-harness-os-theme:prefs';
    var DECOR_ID = 'dsh-harness-os-theme-decor';

    // 装饰层：只使用 DSH 文档化的稳定锚点（[data-slot] / [data-composer-seat]）。
    // 锚点不存在时这些规则自然不命中，不会破坏布局。
    var DECOR_CSS = [
      '/* HARNESS OS — 轻量装饰层（可用设置关闭）*/',
      ':root { --hos-radius: 10px; }',
      /* 输入座与卡片统一一点圆角与描边，贴近参考图的「仪器面板」观感 */
      '[data-composer-seat] { --hos-on: 1; }',
      '[data-composer-seat] > * { border-radius: var(--hos-radius); }',
      /* 小号说明文字用等宽，呼应控制台的 REV / 状态行 */
      '[data-slot] [data-hos-mono], .hos-mono { font-family: var(--dsw-font-family-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace); letter-spacing: .02em; }'
    ].join('\n');

    var DEFAULT_PREFS = { enabled: true, mode: 'auto', decor: true };

    /** 读取本地偏好；任何异常都回落到默认值（启动安全）。 */
    function readPrefs() {
      var out = { enabled: DEFAULT_PREFS.enabled, mode: DEFAULT_PREFS.mode, decor: DEFAULT_PREFS.decor };
      try {
        var raw = window.localStorage.getItem(STORE_KEY);
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            if (typeof parsed.enabled === 'boolean') out.enabled = parsed.enabled;
            if (parsed.mode === 'auto' || parsed.mode === 'light' || parsed.mode === 'dark') out.mode = parsed.mode;
            if (typeof parsed.decor === 'boolean') out.decor = parsed.decor;
          }
        }
      } catch (e) { /* 隐私模式 / 配额 / 坏 JSON：用默认值 */ }
      return out;
    }

    function writePrefs(prefs) {
      try { window.localStorage.setItem(STORE_KEY, JSON.stringify(prefs)); } catch (e) { /* 忽略 */ }
    }

    function themeById(id) {
      for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i];
      return THEMES[0];
    }

    /** 由偏好 + 宿主真实 colorScheme 决定实际生效的令牌集合。 */
    function resolveTheme(prefs, hostScheme) {
      var scheme = prefs.mode === 'auto' ? (hostScheme === 'dark' ? 'dark' : 'light') : prefs.mode;
      return scheme === 'dark' ? themeById('harness-os-dark') : themeById('harness-os-light');
    }

    var applied = [];   // 记录我们写过的属性名，便于逐条撤销

    function applyTokens(theme) {
      if (typeof document === 'undefined' || !document.documentElement) return;
      var root = document.documentElement;
      var tokens = (theme && theme.tokens) || {};
      try {
        for (var key in tokens) {
          if (!Object.prototype.hasOwnProperty.call(tokens, key)) continue;
          var pair = tokens[key];
          var value = pair ? pair.light : undefined;
          if (value === undefined || value === null) continue;
          root.style.setProperty(key, String(value), 'important');
          if (applied.indexOf(key) === -1) applied.push(key);
        }
      } catch (e) { /* 单个属性写失败不影响其余 */ }
    }

    function clearTokens() {
      if (typeof document === 'undefined' || !document.documentElement) return;
      var root = document.documentElement;
      for (var i = 0; i < applied.length; i++) {
        try { root.style.removeProperty(applied[i]); } catch (e) { /* 忽略 */ }
      }
      applied = [];
    }

    function applyDecor(on) {
      if (typeof document === 'undefined' || !document.head) return;
      try {
        // 按 id 查找而不是只看本地引用：客户端 HMR 会重新求值本模块，
        // 此时本地引用归零而 DOM 里的旧 <style> 仍在 —— 只认引用会
        // 插入第二个、且旧的永远删不掉。按 id 操作天然幂等。
        var existing = typeof document.getElementById === 'function' ? document.getElementById(DECOR_ID) : null;
        if (on) {
          if (existing) return;
          var el = document.createElement('style');
          el.id = DECOR_ID;
          el.textContent = DECOR_CSS;
          document.head.appendChild(el);
        } else if (existing && existing.parentNode) {
          existing.parentNode.removeChild(existing);
        }
      } catch (e) { /* 装饰失败不影响令牌 */ }
    }

    /** 一个入口做完「读偏好 → 解析主题 → 应用/撤销」，所有调用点共用。 */
    function render(prefs, hostScheme) {
      try {
        if (!prefs.enabled) { clearTokens(); applyDecor(false); return; }
        applyTokens(resolveTheme(prefs, hostScheme));
        applyDecor(prefs.decor !== false);
      } catch (e) { /* 启动安全：绝不向外抛 */ }
    }

    // ── 防闪烁：工厂求值阶段先应用一次 ──────────────────────────────────
    // 此时 theme 服务还不存在，auto 模式先用 prefers-color-scheme 近似；
    // apply(ctx) 拿到真实 colorScheme 后会立即校正。
    var bootPrefs = readPrefs();
    if (bootPrefs.enabled) {
      var guess = 'light';
      try {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) guess = 'dark';
      } catch (e) { /* 忽略 */ }
      applyTokens(resolveTheme(bootPrefs, guess));
      applyDecor(bootPrefs.decor !== false);
    }

    // ── 设置行（设置 → 通用）────────────────────────────────────────────
    var I18N = {
      zh: {
        title: 'HARNESS OS 主题',
        enable: '启用主题',
        mode: '明暗',
        modeAuto: '跟随宿主',
        modeLight: '浅色',
        modeDark: '深色',
        decor: '仪器装饰层',
        hint: '令牌覆盖 + 轻量装饰；停用即完全还原。'
      },
      en: {
        title: 'HARNESS OS theme',
        enable: 'Enable theme',
        mode: 'Light / dark',
        modeAuto: 'Follow host',
        modeLight: 'Light',
        modeDark: 'Dark',
        decor: 'Instrument decor',
        hint: 'Token overrides plus light decoration; disabling restores everything.'
      }
    };
    var translate = function (key) {
      var table = I18N.zh;
      return (table && table[key]) || key;
    };

    function apply(ctx) {
      var prefs = readPrefs();
      var themeSvc = ctx.get('theme');
      var slots = ctx.get('slots');
      var locale = ctx.get('locale');

      function hostScheme() {
        try {
          if (themeSvc && typeof themeSvc.getTheme === 'function') {
            var snap = themeSvc.getTheme();
            if (snap && snap.active && snap.active.colorScheme) return snap.active.colorScheme;
          }
        } catch (e) { /* 主题服务不可用：回落 light */ }
        return 'light';
      }

      function repaint() { render(prefs, hostScheme()); }

      // 首选方案已应用，这里用真实 colorScheme 校正一次
      repaint();

      // 双语词典：拿不到 locale 就保留中文
      if (locale && typeof locale.register === 'function' && typeof locale.bind === 'function') {
        try {
          locale.register(SOURCE, 'zh', I18N.zh);
          locale.register(SOURCE, 'en', I18N.en);
          var bound = locale.bind(SOURCE);
          translate = function (key) { return bound(key); };
        } catch (e) { /* 词典注册失败不影响主题 */ }
      }

      // 宿主切换明暗时重新解析（auto 模式依赖它）
      var unsub = null;
      try {
        if (themeSvc && typeof themeSvc.subscribe === 'function') {
          unsub = themeSvc.subscribe(function () { repaint(); });
        }
      } catch (e) { /* 订阅失败：仅失去自动跟随 */ }

      // 设置行渲染
      if (React && slots && typeof slots.inject === 'function' && typeof slots.register === 'function') {
        try {
          var Row = function () {
            var force = React.useState(0)[1];
            var rerender = function () { force(function (n) { return n + 1; }); };

            var patch = function (next) {
              prefs = Object.assign({}, prefs, next);
              writePrefs(prefs);
              repaint();
              rerender();
            };

            var box = { display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 0' };
            var line = { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' };
            var chip = function (active) {
              return {
                padding: '4px 10px', cursor: 'pointer',
                borderRadius: '999px',
                border: '1px solid ' + (active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-border-l2)'),
                color: active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-label-secondary)',
                background: 'transparent', font: 'inherit'
              };
            };

            return React.createElement('div', { style: box, 'data-hos': 'settings-row' },
              React.createElement('div', { style: line },
                React.createElement('strong', { style: { fontWeight: 600 } }, translate('title')),
                React.createElement('button', {
                  style: chip(prefs.enabled), type: 'button',
                  onClick: function () { patch({ enabled: !prefs.enabled }); }
                }, translate('enable') + '：' + (prefs.enabled ? '开' : '关'))
              ),
              React.createElement('div', { style: line },
                React.createElement('span', { style: { color: 'var(--dsw-alias-label-secondary)' } }, translate('mode')),
                ['auto', 'light', 'dark'].map(function (m) {
                  var label = m === 'auto' ? translate('modeAuto') : (m === 'light' ? translate('modeLight') : translate('modeDark'));
                  return React.createElement('button', {
                    key: m, type: 'button', style: chip(prefs.mode === m),
                    onClick: function () { patch({ mode: m }); }
                  }, label);
                })
              ),
              React.createElement('div', { style: line },
                React.createElement('button', {
                  style: chip(prefs.decor !== false), type: 'button',
                  onClick: function () { patch({ decor: prefs.decor === false }); }
                }, translate('decor'))
              ),
              React.createElement('div', { style: { color: 'var(--dsw-alias-label-tertiary)', fontSize: '12px' } }, translate('hint'))
            );
          };

          slots.inject('settings.general.item', function () {
            return slots.register(
              { name: 'settings.general.item', id: SOURCE, order: 21 },
              function () { return React.createElement(Row); }
            );
          });
        } catch (e) { /* 设置行失败不影响主题 */ }
      }

      // 卸载：还原一切
      ctx.effect(function () {
        return function () {
          try { if (typeof unsub === 'function') unsub(); } catch (e) { /* 忽略 */ }
          clearTokens();
          applyDecor(false);
        };
      });
    }

    exports.apply = apply;
    exports.inject = ['slots', 'theme', 'locale'];
    return module.exports;
  }
});
