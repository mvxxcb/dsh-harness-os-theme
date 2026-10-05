#!/usr/bin/env node
/**
 * lib/client.js 冒烟测试。
 *
 * 做法：用桩 window / document / React 在 Node 里真跑一遍产物，断言
 *   1. 注册形状正确（id / factory / exports.apply / exports.inject）
 *   2. 工厂求值阶段就应用了令牌（防闪烁路径）
 *   3. apply(ctx) 会按 theme 服务给出的 colorScheme 选对主题
 *   4. 停用后逐条撤销，不留残留
 *   5. 设置行确实注册到 settings.general.item
 *   6. 宿主服务缺失时不抛错（启动安全）
 *
 *   node tests/smoke-client.mjs
 */
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// ── 桩环境 ────────────────────────────────────────────────────────────────
const applied = new Map()   // 当前写在 root 上的属性
const removed = []
const styles = []

function makeStyle() {
  return {
    setProperty(name, value) { applied.set(name, value) },
    removeProperty(name) { applied.delete(name); removed.push(name) },
  }
}

const documentElement = { style: makeStyle() }
const head = {
  children: [],
  appendChild(el) { el.parentNode = this; this.children.push(el) },
  removeChild(el) { const i = this.children.indexOf(el); if (i >= 0) this.children.splice(i, 1); el.parentNode = null },
}
const body = {
  style: makeStyle(),
  children: [],
  appendChild(el) { el.parentNode = this; this.children.push(el) },
}

globalThis.document = {
  documentElement,
  head,
  body,
  createElement() { return { id: '', textContent: '', parentNode: null } },
  getElementById(id) {
    for (const pool of [head.children, body.children]) {
      for (const el of pool) if (el.id === id) return el
    }
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

// 捕获注册
let registration = null
globalThis.window.__ModuleLoader__ = { load(reg) { registration = reg } }

// 桩 React：设置行渲染时只用到 createElement 与 useState
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
  results.push({ name, ok: !!cond, detail })
  console.log(`${cond ? '  ✓' : '  ✗'} ${name}${detail && !cond ? ` — ${detail}` : ''}`)
}

// ── 跑产物 ────────────────────────────────────────────────────────────────
console.log('lib/client.js 冒烟测试\n')
await import(pathToFileURL(join(root, 'lib', 'client.js')).href)

check('注册被捕获', registration !== null)
check('注册 id 正确', registration && registration.id === 'dsh-harness-os-theme', String(registration && registration.id))

const exportsObj = registration.factory(requireStub)
check('exports.apply 是函数', typeof exportsObj.apply === 'function')
check('exports.inject 声明三个服务',
  Array.isArray(exportsObj.inject) && exportsObj.inject.join(',') === 'slots,theme,locale',
  String(exportsObj.inject))

// 工厂求值阶段（防闪烁路径）应已写入令牌
check('工厂阶段已应用令牌（防闪烁）', applied.size > 80, `已写 ${applied.size} 条`)
check('工厂阶段写入的是浅色底', applied.get('--dsw-alias-bg-base') === '#efedea', String(applied.get('--dsw-alias-bg-base')))
check('强调色已映射', applied.get('--dsw-alias-brand-primary') === '#ff7500', String(applied.get('--dsw-alias-brand-primary')))

// ── apply(ctx)：宿主为深色时切到深色套 ────────────────────────────────────
let registeredSlot = null
const ctx = {
  get(name) {
    if (name === 'theme') return { getTheme: () => ({ active: { colorScheme: 'dark' } }), subscribe: () => () => {} }
    if (name === 'slots') return {
      inject: (slot, cb) => { cb() },
      register: (desc, render) => { registeredSlot = { desc, render }; return () => {} },
    }
    if (name === 'locale') return undefined
    return undefined
  },
  effect(fn) { globalThis.__dispose = fn() },
}

let threw = null
try { exportsObj.apply(ctx) } catch (e) { threw = e }
check('apply 不抛错', threw === null, threw && threw.message)
check('深色宿主 → 应用深色底色', applied.get('--dsw-alias-bg-base') === '#141311', String(applied.get('--dsw-alias-bg-base')))
check('深色宿主 → 强调色为深色档', applied.get('--dsw-alias-brand-primary') === '#ff8a2b', String(applied.get('--dsw-alias-brand-primary')))
check('设置行已注册到 settings.general.item',
  registeredSlot !== null && registeredSlot.desc.name === 'settings.general.item' && registeredSlot.desc.id === 'dsh-harness-os-theme',
  registeredSlot && JSON.stringify(registeredSlot.desc))
check('设置行可渲染', (() => {
  try { return registeredSlot.render() !== undefined } catch { return false }
})())

// ── 撤销：必须干净 ────────────────────────────────────────────────────────
const before = applied.size
globalThis.__dispose()
check('卸载后令牌全部撤销', applied.size === 0, `剩余 ${applied.size}（撤销前 ${before}）`)
check('卸载移除了装饰样式表', head.children.length === 0, `head 剩 ${head.children.length} 个节点`)

// ── 启动安全：宿主服务全部缺失时也不能抛 ──────────────────────────────────
const bare = { get: () => undefined, effect: (fn) => fn() }
let bareThrew = null
try { exportsObj.apply(bare) } catch (e) { bareThrew = e }
check('服务全缺失时 apply 不抛错（启动安全）', bareThrew === null, bareThrew && bareThrew.message)

// ── 汇总 ──────────────────────────────────────────────────────────────────
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} 通过`)
if (failed.length > 0) {
  console.error('\n失败项：')
  for (const f of failed) console.error(`  - ${f.name}${f.detail ? ` (${f.detail})` : ''}`)
  process.exit(1)
}
