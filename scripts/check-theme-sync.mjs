#!/usr/bin/env node
/**
 * 一致性 + 契约校验。CI / 提交前的唯一门禁：`node scripts/check-theme-sync.mjs`
 *
 * 校验四件事：
 *   1. lib/client.js 与 themes/*.json **未漂移**（重新注入后逐字节相同）。
 *   2. 主题 id 唯一、colorScheme 合法、tokens 结构合法。
 *   3. 每个主题都覆盖 DSH 的 **14 个 contract 令牌**（缺了主题就只生效一半）。
 *   4. 每个令牌都同时给出 light 与 dark 值（DSH 契约要求双值）。
 *
 * 第 1 条是关键：手改 lib/client.js 里的数据而不跑生成器，会让提交的产物
 * 与数据源悄悄分叉 —— 这正是本仓库最想避免的一类错误。
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectThemes, inject } from './build-client.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/** DSH 主题契约要求必须覆盖的 14 个令牌（取自运行中的 theme 服务 listTokens）。 */
const CONTRACT_TOKENS = [
  '--dsw-alias-bg-base',
  '--dsw-alias-bg-layer-1',
  '--dsw-alias-bg-layer-2',
  '--dsw-alias-bg-overlay',
  '--dsw-alias-border-l1',
  '--dsw-alias-border-l2',
  '--dsw-alias-brand-primary',
  '--dsw-alias-label-primary',
  '--dsw-alias-label-secondary',
  '--dsw-alias-state-error-primary',
  '--dsw-alias-state-idle-primary',
  '--dsw-alias-state-success-primary',
  '--dsw-alias-state-warn-primary',
  '--dsw-specific-sidebar-fill',
]

const problems = []
const fail = (msg) => problems.push(msg)

// ── 1. 产物未漂移 ────────────────────────────────────────────────────────
let themes
try {
  themes = collectThemes()
} catch (error) {
  console.error(`✗ themes 读取失败：${error.message}`)
  process.exit(1)
}

const template = readFileSync(join(root, 'src', 'client.template.js'), 'utf8')
const expectedClient = inject(themes, template)
const actualClient = readFileSync(join(root, 'lib', 'client.js'), 'utf8')
if (expectedClient !== actualClient) {
  fail('lib/client.js 与 themes/*.json 不一致 —— 请运行 `node scripts/build-client.mjs` 重新生成')
}

// ── 2/3/4. 数据契约 ──────────────────────────────────────────────────────
for (const theme of themes) {
  const where = `主题 ${theme.id}`
  if (theme.colorScheme !== 'light' && theme.colorScheme !== 'dark') {
    fail(`${where}: colorScheme 必须是 light 或 dark（现为 ${JSON.stringify(theme.colorScheme)}）`)
  }
  for (const field of ['label', 'description']) {
    if (typeof theme[field] !== 'string' || theme[field].trim() === '') {
      fail(`${where}: 缺少非空 ${field}`)
    }
  }
  if (!theme.tokens || typeof theme.tokens !== 'object') {
    fail(`${where}: 缺少 tokens`)
    continue
  }

  for (const token of CONTRACT_TOKENS) {
    if (!(token in theme.tokens)) fail(`${where}: 缺少 contract 令牌 ${token}`)
  }

  for (const [token, pair] of Object.entries(theme.tokens)) {
    if (!token.startsWith('--dsw-')) {
      fail(`${where}: 令牌名必须以 --dsw- 开头（收到 ${token}）`)
    }
    if (!pair || typeof pair !== 'object') {
      fail(`${where}: ${token} 的值必须是 { light, dark } 对象`)
      continue
    }
    for (const scheme of ['light', 'dark']) {
      const value = pair[scheme]
      if (typeof value !== 'string' || value.trim() === '') {
        fail(`${where}: ${token} 缺少 ${scheme} 值`)
      }
    }
  }
}

// ── 汇总 ─────────────────────────────────────────────────────────────────
const tokenCount = themes.reduce((n, t) => n + Object.keys(t.tokens || {}).length, 0)
if (problems.length > 0) {
  console.error(`✗ check 失败（${problems.length} 项）：`)
  for (const p of problems) console.error(`   - ${p}`)
  process.exit(1)
}
console.log(`✓ 全部通过：${themes.length} 个主题、${tokenCount} 条令牌映射、contract 令牌 ${CONTRACT_TOKENS.length}/14 全覆盖`)
