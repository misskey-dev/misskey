---
name: context-budget
description: Codex セッションのコンテキスト窓消費を agents/skills/MCP/rules/AGENTS.md ごとに見える化し、肥大化と冗長コンポーネントを検出して節約候補を提示する。"コンテキスト消費を見せて"、"context budget"、"context audit"、"トークン内訳"、"これ以上 MCP 入る？" 等の発話で起動する。
---

<!--
SPDX-License-Identifier: MIT
SPDX-FileCopyrightText: 2026 Affaan Mustafa and everything-Codex contributors

出典 (upstream): https://github.com/affaan-m/everything-Codex (v2.0.0-rc.1)
upstream path: skills/context-budget/SKILL.md
upstream origin frontmatter: ECC
upstream license: MIT — https://github.com/affaan-m/everything-Codex/blob/main/LICENSE
project-level notice: see .Codex/THIRD_PARTY_LICENSES.md (Misskey 内サードパーティ一覧 + MIT 全文)

Imported into Misskey .Codex/ on 2026-05-10 as a standalone copy (no dependency on the ECC plugin runtime). description was rewritten in Japanese and a "Misskey 固有メモ" section was appended; body content remains MIT-licensed.

note: Misskey の skills/agents 数は少ないので、MCP / AGENTS.md / プラグイン由来の overhead が支配的になりやすい点に留意。
-->

# Context Budget

セッション内に読み込まれるコンポーネント (agents / skills / rules / MCP servers / AGENTS.md) の token overhead を分析し、空き context を回復する具体策を提示する。

## 使う場面

- セッションが重い・出力品質が落ちてきた感覚がある
- 直近で skills / agents / MCP server を多数追加した
- 残りの context headroom を知りたい
- 追加コンポーネントを入れる前に空きを確認したい
- 「context-budget」「token 内訳」等のキーワードでユーザーが明示的に要請した時 (Misskey リポジトリにはこの名前のスラッシュコマンドは登録していない — 本 skill は名前 / description マッチで auto-invoke される想定。実装済の slash command 一覧は [.Codex/commands/](../../commands/) を参照)

## 仕組み

### Phase 1: Inventory

各コンポーネントを走査して token を推定する。

**Agents** (`.Codex/agents/*.md`)
- 行数とトークン数 (`words × 1.3`) を計算
- frontmatter `description` の長さを抽出
- フラグ: 200 行超 (重い)、description 30 word 超 (frontmatter 肥大)

**Skills** (`.Codex/skills/*/SKILL.md`)
- SKILL.md ごとに token を計算
- フラグ: 400 行超
- `.agents/skills/` 等の重複コピーは除外

**Rules** (リポジトリルートの `AGENTS.md` + `.Codex/` から `@-import` されるファイル)
- ファイル単位で token 計算
- フラグ: 100 行超
- 同一言語モジュール内の内容重複を検出

**MCP Servers** (`.mcp.json` または有効 MCP 設定)
- server 数と総 tool 数
- schema overhead をツールあたり ~500 token で見積もる
- フラグ: 20 tool 超のサーバー、`gh` / `git` / `npm` 等の CLI を単純ラップしただけのサーバー

**AGENTS.md** (project + user-level)
- ファイルごとに token を計算
- フラグ: 合計 300 行超

### Phase 2: Classify

| バケット           | 判定基準                                                    | 行動                              |
|--------------------|-------------------------------------------------------------|-----------------------------------|
| **Always needed**  | AGENTS.md から参照されている / 有効コマンドの裏 / 現プロジェクトと一致 | 維持                              |
| **Sometimes needed** | ドメイン依存 (例: 言語パターン)、AGENTS.md 参照なし          | オンデマンド有効化を検討          |
| **Rarely needed**  | コマンド参照なし、内容重複、明確な用途なし                  | 削除または lazy-load              |

### Phase 3: Detect Issues

- **Bloated agent description** — frontmatter description が 30 word 超だと、Task ツール起動のたびに毎回ロードされる
- **Heavy agents** — 200 行超は Task ツールの context を毎回膨らませる
- **Redundant components** — agent ロジックを重複する skill、AGENTS.md と重複する rule
- **MCP over-subscription** — 10 server 超、または CLI 代用可能なサーバー
- **AGENTS.md bloat** — 冗長説明、古いセクション、rule に移すべき指示

### Phase 4: Report

```
Context Budget Report
═══════════════════════════════════════

Total estimated overhead: ~XX,XXX tokens
Context model: <現在モデル名> (<window>K window)   ← 例: Codex Opus 4.7 (1M), Codex Sonnet (200K)
Effective available context: ~XXX,XXX tokens (XX%)

Component Breakdown:
┌─────────────────┬────────┬───────────┐
│ Component       │ Count  │ Tokens    │
├─────────────────┼────────┼───────────┤
│ Agents          │ N      │ ~X,XXX    │
│ Skills          │ N      │ ~X,XXX    │
│ Rules           │ N      │ ~X,XXX    │
│ MCP tools       │ N      │ ~XX,XXX   │
│ AGENTS.md       │ N      │ ~X,XXX    │
└─────────────────┴────────┴───────────┘

WARNING: Issues Found (N):
[token 節約量の降順]

Top 3 Optimizations:
1. [action] → save ~X,XXX tokens
2. [action] → save ~X,XXX tokens
3. [action] → save ~X,XXX tokens

Potential savings: ~XX,XXX tokens (XX% of current overhead)
```

verbose mode ではさらにファイルごとの token 内訳、最重ファイルの行単位ブレークダウン、重複行の対比、MCP tool 一覧 + tool ごとの schema サイズ推定を出す。

## 例

**基本監査**
```
User: コンテキスト消費を見せて
Skill: 16 agents (12,400 tokens), 28 skills (6,200), 87 MCP tools (43,500), 2 AGENTS.md (1,200)
       Flags: 重い agent 3 個、CLI 代用可能な MCP 3 個
       Top saving: MCP 3 個削除 → -27,500 tokens (overhead の 47% 削減)
```

**Verbose**
```
User: トークン内訳をファイル単位で
Skill: 上記レポートに加えて、planner.md (213 lines, 1,840 tokens) のような
       per-file 行内訳、MCP tool ごとのサイズ、rule の重複行を side-by-side で表示
```

**追加前チェック**
```
User: MCP server を 5 個追加したいが、空きある？
Skill: 現状 33% → 5 server (≈ 50 tools) 追加で +25,000 tokens → 45% に到達
       推奨: CLI 代用可能な server 2 個を先に外して 40% 以下を維持
```

## ベストプラクティス

- **トークン推定**: prose は `words × 1.3`、code 主体は `chars / 4`
- **MCP は最大のレバー**: tool あたり ~500 token、30-tool server ひとつで全 skill より大きい
- **agent description は常時ロード**: 呼ばれない agent でも description は毎 Task 投入
- **verbose は debug 用**: 普段は使わない
- **変更後は監査**: agent/skill/MCP 追加直後に走らせて creep を早期発見

## Misskey 固有メモ

- Misskey は MCP server をプロジェクトで明示登録していないため (`.mcp.json` 不在)、現状 overhead の支配項は AGENTS.md と公式プラグイン群の skills / agents description である。
- ECC プラグインがユーザースコープで `installed_plugins.json` に存在するため、プロジェクトで `enabledPlugins` に追加していなくても system reminder に 200+ skill が現れる。これらは description が短いので個別 overhead は小さいが、合計値の確認に本 skill を使う。
