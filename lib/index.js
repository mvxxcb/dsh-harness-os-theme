/**
 * dsh-harness-os-theme — Host (node) half.
 *
 * 这是一个**纯客户端主题包**：全部工作量在浏览器侧（`lib/client.js` 把
 * `--dsw-*` 令牌写到 documentElement 上）。Cordis 的加载器要求每一个 loader
 * 行都能作为合法插件被 import 并构造 fiber，所以本文件存在，且只做一件事：
 * 让这一行成为合法的空插件。
 *
 * 刻意不做三件事：
 *   1. 不导出 `default` —— cordis 的 unwrapExports 是 `exports.default ?? exports`，
 *      只写具名导出可以避免"改一处忘一处"的双份维护。
 *   2. 不导出 `Config` —— 那是 schemastery schema，本插件不吃 profile 配置；
 *      误当作 schema 用会抛错。偏好由浏览器侧 localStorage 持有。
 *   3. 不声明任何 `@deepseek-ai/dsh-*` peerDependency —— DSH 的启动期兼容预检
 *      只检查这些 peer，声明了就要跟着宿主版本线走，声明不匹配会被**静默禁用整行**。
 *      本插件只读稳定公开服务，无版本耦合。
 *
 * @module dsh-harness-os-theme
 */

const name = 'dsh-harness-os-theme'

/** 不依赖任何宿主服务。 */
const inject = []

/** 空实现：主题在浏览器侧生效。 */
function apply() {
  /* 有意的空实现 —— 无需 host 侧工作。 */
}

export { apply, inject, name }
