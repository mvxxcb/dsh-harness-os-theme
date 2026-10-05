# dsh-harness-os-theme

**HARNESS OS — a warm-paper + orange console theme pack for the DeepSeek Harness Web UI.**

> Warm paper ground · `#ff7500` orange accent · near-black mono annotations · instrument-panel feel. Ships a matched light and dark palette.

English · [中文](README.zh.md)

---

## What it is

A **pure client-side theme pack**. It does one thing: remap the DSH `--dsw-*` design tokens onto the HARNESS OS palette so the whole surface — conversation, sidebar, code blocks, diffs, bubbles, scrollbars, settings — reads consistently as a warm-paper/near-black instrument panel.

- **No DSH source changes**, no component replacement, no DOM restructuring (beyond one optional, switchable decoration stylesheet).
- **Zero dependencies, zero build approval**: `lib/client.js` is a committed artifact, so installing runs no build scripts.
- **Fully reversible**: disabling or uninstalling restores every token it touched.
- Follows the host's light/dark switch automatically, or lock it to light/dark.

## Install

```sh
# Straight from GitHub
dsh plugin --profile <your-profile> add github:mvxxcb/dsh-harness-os-theme

# Or clone and install locally
git clone https://github.com/mvxxcb/dsh-harness-os-theme
dsh plugin --profile <your-profile> add ./dsh-harness-os-theme
```

> `<your-profile>` is usually `web` or `desktop`, whichever profile runs your DSH Web UI.

**Restart DSH** afterwards (the host half adds a loader row), then reload the page.

Uninstall:

```sh
dsh plugin --profile <your-profile> remove dsh-harness-os-theme
```

## Usage

**Settings → General → HARNESS OS theme**:

| Control | Meaning |
|---|---|
| Enable | Master switch; turning it off removes the override layer and the decoration, restoring the host's own colors |
| Light / dark | `Follow host` / `Force light` / `Force dark`. **On a dark host, pick "Force light" to see the light palette** |
| Instrument decor | Light decoration (card radius, mono hooks); when the anchors are absent the rules simply do not match |

Tokens stack through **DSH's official `theme.overrideTokens()` layer** — not by writing inline styles, which land on `<html>` and get shadowed by the tokens on `body`/`#root` (see [docs/DESIGN.md](docs/DESIGN.md) §3.1). Both palettes are also registered through `theme.register()`, so they appear in **DSH's own appearance picker**.

Choices are stored in the browser's `localStorage` and survive restarts.

## Compatibility

| Item | Notes |
|---|---|
| Platform | The DSH Web surface (`platform: web`) |
| Host version | Developed and verified on **DSH 0.2.0-rc.2** |
| Peer declarations | **Deliberately declares no `@deepseek-ai/dsh-*` peerDependency.** DSH's start-up compatibility preflight checks those peers and will **silently disable the whole profile row** when a range does not match. This plugin only reads stable public services (`theme` / `slots` / `locale`) and has no version coupling, so declaring nothing keeps it off the version treadmill |

## Layout

```
themes/*.json                <- theme data (single source of truth)
src/client.template.js       <- client template (holds the only placeholder)
scripts/build-client.mjs     <- generator: data -> lib/client.js
scripts/check-theme-sync.mjs <- gate: artifact drift + contract completeness
tests/smoke-client.mjs       <- stubbed-DOM smoke test of the generated bundle
schema/theme.schema.json     <- theme data structure
lib/client.js                <- generated artifact (committed)
lib/index.js                 <- host half: an empty plugin, only to satisfy the loader
docs/DESIGN.md               <- design notes: sampling, token system, boot safety, pitfalls
```

## Development

```sh
node scripts/build-client.mjs      # regenerate lib/client.js after editing themes/*.json
node scripts/check-theme-sync.mjs  # pre-commit gate: artifact consistency + all 14 contract tokens
node tests/smoke-client.mjs        # stubbed-DOM smoke test: shape / token apply / teardown / boot safety

# or all at once
npm run verify
```

**Edit `themes/*.json`, never `lib/client.js` directly** — the latter is generated, and the gate compares it byte-for-byte against the data source.

### Adding a theme

Drop another JSON array into `themes/` (structure in `schema/theme.schema.json`), cover all 14 contract tokens with both light and dark values, regenerate, and run the gate.

## Design notes

Where the colors came from, the DSH token system (423 `--dsw-*` properties), the client-module shape, the boot-safety rules, and the pitfalls hit along the way are all in **[docs/DESIGN.md](docs/DESIGN.md)**.

## License

[MIT](LICENSE)
