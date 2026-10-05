#!/usr/bin/env node
/**
 * lib/client.js 冒烟测试。
 *
 * 用桩 window / document / React / theme 服务在 Node 里真跑一遍产物，断言
 *   1. 注册形状正确（id / factory / exports.apply / exports.inject）
 *   2. 使用**官方** theme.overrideTokens 叠加覆盖层，而不是自己写内联样式
 *   3. 覆盖层内容正确：浅深成对、关键令牌值取自 themes/*.json
 *   4. 两套配色经 theme.register 注册进注册表，且令牌是**单值字符串**（注册表形态）
 *   5. 强制浅色/深色时两侧同值（这样深色宿主下也能看到浅色观感）
 *   6. 停用与卸载都精确撤销：调用 disposer、移除装饰样式表
 *   7. 宿主服务全缺失时不抛错（启动安全）
 *   8. theme/change 会触发重画
 *
 *   node tests/smoke-client.mjs
 */
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// ── 桩 DOM ────────────────────────────────────────────────────────────────
const head = {
  children: [],
  appendChild(el) { el.parentNode = this; this.children.push(el) },
  removeChild(el) { const i = this.children.indexOf(el); if (i >= 0) this.children.splice(i, 1); el.parentNode = null },
}

globalThis.document = {
  documentElement: { style: { setProperty() {}, removeProperty() {} } },
  head,
  body: { style: {}, children: [] },
  createElement() { return { id: '', textContent: '', parentNode: null } },
  getElementById(id) {
    for (const el of head.children) if (el.id === id) return el
    return null
  },
}
globalThis.window = {
  matchMedia: () => ({ matches: false }),
  localStorage: {
    _v: new Map(),
    getItem(k) { return this._v.has(k) ? this._v.get(k) : null },
    setItem(k, v) { this._v.set(k, String(v)) },
  },
}

let registration = null
globalThis.window.__ModuleLoader__ = { load(reg) { registration = reg } }

const React = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  useState: (init) => [init, () => {}],
}
const requireStub = (name) => {
  if (name === 'react') return React
  throw new Error(`unexpected require(${name})`)
}

// ── 断言工具 ──────────────────────────────────────────────────────────────
const results = []
function check(name, cond, detail = '') {
  results.push({ name, ok: !!cond })
  console.log(`${cond ? '  ✓' : '  ✗'} ${name}${detail && !cond ? ` — ${detail}` : ''}`)
}

// ── 跑产物 ────────────────────────────────────────────────────────────────
console.log('lib/client.js 冒烟测试\n')
await import(pathToFileURL(join(root, 'lib', 'client.js')).href)

check('注册被捕获', registration !== null)
check('注册 id 正确', registration && registration.id === 'dsh-harness-os-theme', String(registration && registration.id))

const mod = registration.factory(requireStub)
check('exports.apply 是函数', typeof mod.apply === 'function')
check('exports.inject 声明三个服务',
  Array.isArray(mod.inject) && mod.inject.join(',') === 'slots,theme,locale', String(mod.inject))

// ── 搭一个有 theme 服务的 ctx ─────────────────────────────────────────────
let calls = []
let registeredThemes = []
let registeredDisposed = 0
let layer = null
let layerDisposed = 0
let preference = 'dark'
let changeHandler = null

function makeThemeService() {
  return {
    getTheme: () => ({ preference, active: { id: preference, colorScheme: preference }, themes: [] }),
    register(def) { registeredThemes.push(def); return () => { registeredDisposed++ } },
    overrideTokens(source, tokens) {
      calls.push({ source, tokens })
      layer = { source, tokens }
      return () => { layerDisposed++; layer = null }
    },
    on(event, cb) { if (event === 'theme/change') changeHandler = cb; return () => { changeHandler = null } },
  }
}

let registeredSlot = null
function makeCtx() {
  return {
    get(name) {
      if (name === 'theme') return makeThemeService()
      if (name === 'slots') return {
        inject: (slot, cb) => { cb() },
        register: (desc, render) => { registeredSlot = { desc, render }; return () => {} },
      }
      if (name === 'locale') return undefined
      return undefined
    },
    effect(fn) { globalThis.__dispose = fn() },
  }
}

const PREFS = 'dsh-harness-os-theme:prefs'
const setPrefs = (o) => globalThis.window.localStorage.setItem(PREFS, JSON.stringify(o))

// ── 默认（auto + 深色宿主）────────────────────────────────────────────────
setPrefs({ enabled: true, mode: 'auto', decor: true })
calls = []; registeredThemes = []; layerDisposed = 0
let threw = null
try { mod.apply(makeCtx()) } catch (e) { threw = e }
check('apply 不抛错', threw === null, threw && threw.message)

check('使用官方 overrideTokens（而非内联样式）',
  calls.length === 1 && calls[0].source === 'dsh-harness-os-theme',
  `calls=${calls.length}`)

const L = calls[0] && calls[0].tokens
check('覆盖层含 100+ 对令牌', L && Object.keys(L).length > 100, L ? `${Object.keys(L).length} 条` : 'none')
check('覆盖层浅色值正确', !!L && !!L['--dsw-alias-bg-base'] && L['--dsw-alias-bg-base'].light === '#efedea',
  L && JSON.stringify(L['--dsw-alias-bg-base']))
check('覆盖层深色值正确', !!L && !!L['--dsw-alias-bg-base'] && L['--dsw-alias-bg-base'].dark === '#141311',
  L && JSON.stringify(L['--dsw-alias-bg-base']))
check('强调色成对且为品牌橙',
  !!L && !!L['--dsw-alias-brand-primary']
  && L['--dsw-alias-brand-primary'].light === '#ff7500' && L['--dsw-alias-brand-primary'].dark === '#ff8a2b',
  L && JSON.stringify(L['--dsw-alias-brand-primary']))
check('每一条都是 { light, dark } 字符串对（运行时校验会拒绝裸字符串）',
  !!L && Object.values(L).every((p) => p && typeof p.light === 'string' && typeof p.dark === 'string'))

check('两套配色已注册进注册表', registeredThemes.length === 2, `registered=${registeredThemes.length}`)
check('注册形态正确（单值字符串 + colorScheme）',
  registeredThemes.length === 2
  && registeredThemes[0].id === 'harness-os-light' && registeredThemes[0].colorScheme === 'light'
  && registeredThemes[1].id === 'harness-os-dark' && registeredThemes[1].colorScheme === 'dark'
  && registeredThemes.every((d) => typeof d.tokens['--dsw-alias-bg-base'] === 'string'))
check('注册的令牌是单值（注册表形态，不是对象对）',
  registeredThemes.length === 2
  && registeredThemes[0].tokens['--dsw-alias-bg-base'] === '#efedea'
  && registeredThemes[1].tokens['--dsw-alias-bg-base'] === '#141311')

check('设置行已注册到 settings.general.item',
  registeredSlot !== null && registeredSlot.desc.name === 'settings.general.item',
  registeredSlot && JSON.stringify(registeredSlot.desc))
check('设置行可渲染', (() => { try { return registeredSlot.render() !== undefined } catch { return false } })())

// ── 强制浅色：深色宿主下也应两侧同值 ──────────────────────────────────────
setPrefs({ enabled: true, mode: 'light', decor: true })
calls = []
mod.apply(makeCtx())
const forced = calls[0] && calls[0].tokens
check('强制浅色时两侧同值（深色宿主也能看到浅色观感）',
  !!forced && !!forced['--dsw-alias-bg-base']
  && forced['--dsw-alias-bg-base'].light === '#efedea'
  && forced['--dsw-alias-bg-base'].dark === '#efedea',
  forced && JSON.stringify(forced['--dsw-alias-bg-base']))

// ── 停用：走真实路径（从设置行点开关），而不是"新实例 + 已停用" ────────────
setPrefs({ enabled: true, mode: 'auto', decor: true })
const disposeBefore = layerDisposed
mod.apply(makeCtx())
check('启用时装饰已插入', head.children.length === 1, `head=${head.children.length}`)
check('启用时已叠加覆盖层', layer !== null)

// 渲染设置行并找到"启用"开关
const rowElement = registeredSlot.render()
const rowTree = typeof rowElement.type === 'function' ? rowElement.type(rowElement.props) : rowElement
function findButton(node, needle) {
  if (!node || typeof node !== 'object') return null
  if (node.type === 'button' && Array.isArray(node.children) && node.children.join('').includes(needle)) return node
  for (const kid of node.children || []) {
    const hit = findButton(kid, needle)
    if (hit) return hit
  }
  return null
}
const enableBtn = findButton(rowTree, '启用')
check('设置行含启用开关', enableBtn !== null)

enableBtn.props.onClick()   // 关掉主题
check('停用时撤销覆盖层（真实路径）', layerDisposed === disposeBefore + 1 && layer === null, `disposed=${layerDisposed}`)
check('停用时移除装饰样式表（真实路径）', head.children.length === 0, `head=${head.children.length}`)

// ── 卸载：覆盖层与注册都要撤 ──────────────────────────────────────────────
setPrefs({ enabled: true, mode: 'auto', decor: true })
mod.apply(makeCtx())
const beforeUnload = layerDisposed
const regBefore = registeredDisposed
globalThis.__dispose()
check('卸载时撤销覆盖层', layerDisposed === beforeUnload + 1, `before=${beforeUnload} after=${layerDisposed}`)
check('卸载时撤销主题注册', registeredDisposed === regBefore + 2, `before=${regBefore} after=${registeredDisposed}`)
check('卸载移除装饰样式表', head.children.length === 0, `head=${head.children.length}`)

// ── 启动安全：服务全缺失 ──────────────────────────────────────────────────
let bareThrew = null
try { mod.apply({ get: () => undefined, effect: (fn) => fn() }) } catch (e) { bareThrew = e }
check('服务全缺失时 apply 不抛错（启动安全）', bareThrew === null, bareThrew && bareThrew.message)

// ── theme/change 重画 ─────────────────────────────────────────────────────
setPrefs({ enabled: true, mode: 'auto', decor: true })
calls = []
mod.apply(makeCtx())
if (typeof changeHandler === 'function') {
  const n = calls.length
  changeHandler()
  check('theme/change 触发重画', calls.length > n, `before=${n} after=${calls.length}`)
} else {
  check('theme/change 订阅已建立', false, 'changeHandler 未注册')
}

// ── 汇总 ──────────────────────────────────────────────────────────────────
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} 通过`)
if (failed.length > 0) {
  console.error('\n失败项：')
  for (const f of failed) console.error(`  - ${f.name}`)
  process.exit(1)
}
