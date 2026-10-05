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
    var THEMES = __HOS_THEMES__;
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
