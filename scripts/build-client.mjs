#!/usr/bin/env node
/**
 * 生成 lib/client.js：把 themes/*.json 的**全部主题**注入到
 * src/client.template.js 的 `__THEMES_JSON__` 占位符处。
 *
 * 为什么用生成而不是运行时读取：DSH 的客户端 bundle 是单个自包含文件
 * （由 client-modules 以一条 URL 下发），无法在浏览器里 import 兄弟模块或
 * 读磁盘上的 JSON。把数据编译进 bundle 是唯一可行且零依赖的做法。
 *
 * 这不是安装脚本 —— 它只在开发时手动运行，重新生成后连同 lib/client.js 一起提交。
 *
 *   node scripts/build-client.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const themesDir = join(root, 'themes')
const templatePath = join(root, 'src', 'client.template.js')
const outPath = join(root, 'lib', 'client.js')
const PLACEHOLDER = '__HOS_THEMES__'
const INDENT = '    ' // 占位符所在的缩进层级

/** 读出所有主题，按文件名字典序合并成一个数组（输出稳定，便于比对）。 */
export function collectThemes() {
  const files = readdirSync(themesDir).filter((f) => f.endsWith('.json')).sort()
  const all = []
  const seen = new Set()
  for (const file of files) {
    const parsed = JSON.parse(readFileSync(join(themesDir, file), 'utf8'))
    if (!Array.isArray(parsed)) throw new Error(`${file}: 顶层必须是数组`)
    for (const theme of parsed) {
      if (!theme || typeof theme.id !== 'string' || theme.id === '') {
        throw new Error(`${file}: 每个主题必须有非空字符串 id`)
      }
      if (seen.has(theme.id)) throw new Error(`主题 id 重复：${theme.id}`)
      seen.add(theme.id)
      all.push(theme)
    }
  }
  if (all.length === 0) throw new Error('themes/ 下没有找到任何主题')
  return all
}

/** 把主题 JSON 按占位符层级重新缩进。 */
export function inject(themes, template) {
  // 占位符必须**恰好出现一次**。若它在注释或文档里也出现，字符串替换会命中
  // 注释而不是代码 —— 产物看起来"生成成功"，实际注入到了错误的位置。
  const occurrences = template.split(PLACEHOLDER).length - 1
  if (occurrences !== 1) {
    throw new Error(`模板中 ${PLACEHOLDER} 必须恰好出现 1 次，实际 ${occurrences} 次`)
  }
  const json = JSON.stringify(themes, null, 2)
    .split('\n')
    .map((line, i) => (i === 0 ? line : INDENT + line))
    .join('\n')
  return template.replace(PLACEHOLDER, json)
}

function main() {
  const themes = collectThemes()
  const template = readFileSync(templatePath, 'utf8')
  const out = inject(themes, template)
  writeFileSync(outPath, out, 'utf8')
  const ids = themes.map((t) => t.id).join(', ')
  console.log(`lib/client.js 已生成：${themes.length} 个主题 [${ids}]`)
}

// 仅在被直接执行时写盘（被 check 脚本 import 时不写）
if (process.argv[1] && process.argv[1].endsWith('build-client.mjs')) main()
