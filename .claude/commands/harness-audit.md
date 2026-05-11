---
description: Misskey の .claude/ ハーネス (skills/agents/commands) を 7 カテゴリで採点する確定的な監査。
argument-hint: "[repo|skills|commands|agents]"
---

<!--
SPDX-License-Identifier: MIT
SPDX-FileCopyrightText: 2026 Affaan Mustafa and everything-claude-code contributors

出典 (upstream): https://github.com/affaan-m/everything-claude-code (v2.0.0-rc.1)
upstream path: commands/harness-audit.md
upstream license: MIT — https://github.com/affaan-m/everything-claude-code/blob/main/LICENSE
project-level notice: see .claude/THIRD_PARTY_LICENSES.md (Misskey 内サードパーティ一覧 + MIT 全文)

Imported into Misskey .claude/ on 2026-05-10. The 7-category rubric and output contract are derived from the upstream ECC version (MIT). The runtime layer was substantially reimplemented for Misskey: the upstream relies on scripts/harness-audit.js to mechanically score, while this version asks Claude to score directly with pnpm/git/grep, and adds Misskey-specific evaluation axes (SPDX coverage / endpoint-list 登録漏れ / migration 順序 / ja-JP.yml 整合).

note: 元 ECC 版は scripts/harness-audit.js (専用 Node スクリプト) で機械採点していたが、Misskey は ECC plugin runtime に依存しない方針なので、Claude が直接ファイルを読んで採点する手動運用版に書き換えた。Misskey 固有の重要観点 (SPDX 適用率 / endpoint-list 登録漏れ / migration 順序 / ja-JP.yml 整合) を評価軸として明示的に組み込んでいる。
-->

# /harness-audit — Misskey ハーネス監査

Misskey リポジトリの `.claude/` 構成を 7 カテゴリで採点し、改善優先度を提示する。

## Usage

`/harness-audit [scope]`

- `scope` (任意): `repo` (default) / `skills` / `commands` / `agents`

## 評価カテゴリ (各 0-10)

| # | カテゴリ | 評価軸 |
| --- | --- | --- |
| 1 | Tool Coverage | skill / agent / command の数、欠けているワークフロー段、重複なし |
| 2 | Context Efficiency | frontmatter description の冗長度、SKILL.md の長さ分布、重複情報、CLAUDE.md の肥大化 |
| 3 | Quality Gates | Stop / PreToolUse / PostToolUse hook の整備、`/quality-gate` 等の完了前ゲートの有無、自動 lint/typecheck |
| 4 | Memory Persistence | docs/* の同期状態を評価。プロジェクト側 `.claude/memory/` は未採用方針 (auto-memory はユーザーホーム側で自動運用) のため、ここを採点起点にせず既定 5/10 から開始する |
| 5 | Eval Coverage | testing.md の網羅、Misskey 固有の e2e/fed/Storybook/Cypress 適用ガイド |
| 6 | Security Guardrails | SPDX 規約適用、migration 不変性ルール、ja-JP.yml 限定編集ルール、secrets 検出 |
| 7 | Cost Efficiency | enabledPlugins の重複・過剰、context-budget の整備、MCP 過剰登録なし |

## Misskey 固有の確認項目 (採点根拠コマンド)

採点時に以下を実コマンドで確認する。各項目の **属するカテゴリ** は項目内に明記する (#1-#3 は Security Guardrails、#4 は Tool Coverage、#5 は Quality Gates):

```bash
# 1. [Security Guardrails] SPDX 適用率 (新規ファイル想定の汎用チェック)
#    - node_modules を prune で除外
#    - packages/misskey-js は MIT サブパッケージなので AGPL ヘッダーを持たない (AGENTS.md §1) → 除外
#    - built/ なども除外
#    候補にはなお *.config.{ts,js} / *eslint* / *.d.ts のような CI 上 SPDX 対象外
#    (.github/workflows/check-spdx-license-id.yml の exclude 参照) も混ざるため、
#    上位に出たファイルが「新規追加した実コード」かどうかは目視判定する。
find packages \
  \( -type d \( -name node_modules -o -name built -o -name dist -o -path 'packages/misskey-js' \) -prune \) \
  -o -type f \( -name '*.ts' -o -name '*.js' -o -name '*.vue' -o -name '*.scss' \) -print \
  | xargs -r grep -L 'SPDX-License-Identifier: AGPL-3.0-only' | head -20
# → 上位に新規実コードが無ければ満点

# 2. [Security Guardrails] ja-JP.yml 以外の locales が直近で手動編集されていないか
#    --pretty=format: でコミットヘッダ行を抑止し、ファイル名行のみを残してから grep する。
#    Crowdin の自動同期 commit でも他言語 yml は更新されるため、出力が 0 行になることは少ない。
#    出力があった場合は、author / commit message を確認し Crowdin 由来か手動編集かを判定する:
#    git log --since='30 days ago' --pretty=format:'%h %an %s' -- locales/<file>.yml
git log --since='30 days ago' --pretty=format: --name-only -- 'locales/*.yml' \
  | grep -v '^$' | grep -v 'ja-JP.yml' | sort -u
# → 出力が無い、または全て Crowdin 由来 commit なら満点

# 3. [Security Guardrails] migration の pending DDL 検査 (TypeORM schema builder)
pnpm --filter backend check-migrations
# → 0 errors (= "All migrations are clean.") なら満点

# 4. [Tool Coverage] endpoint-list.ts 登録漏れ (新規 endpoint がリストにない場合)
#    endpoints/ は再帰構造 (notes/create.ts, admin/announcements/create.ts 等) で 400+ ファイルあるため、
#    endpoint-list.ts も `export * as '<category>/<name>' from './endpoints/<category>/<name>.js';` 形式で
#    1 ファイル 1 行登録される。両者の行数を「再帰 .ts 数」と「export * as 行数」で比較する。
#    e2e / 単体テストは endpoint ではないので *.test.ts を除外する。
endpoint_files=$(find packages/backend/src/server/api/endpoints -type f -name '*.ts' ! -name '*.test.ts' | wc -l)
list_entries=$(grep -cE "^export \* as " packages/backend/src/server/api/endpoint-list.ts)
echo "endpoints (recursive): $endpoint_files / endpoint-list.ts entries: $list_entries"
# 差分が 0 なら満点。差分が出たら、登録漏れの具体特定:
comm -23 \
  <(find packages/backend/src/server/api/endpoints -type f -name '*.ts' ! -name '*.test.ts' \
    | sed -E 's|.*/endpoints/||;s|\.ts$||' | sort -u) \
  <(grep -oE "^export \* as '[^']+'" packages/backend/src/server/api/endpoint-list.ts \
    | sed -E "s/^export \* as '([^']+)'/\1/" | sort -u)
# 出力された行が登録漏れの endpoint。0 行なら満点。

# 5. [Quality Gates] console.log の混入
grep -rn 'console\.\(log\|debug\)' packages/backend/src packages/frontend/src 2>/dev/null \
  | grep -v 'node_modules\|test\|.spec\.\|.test\.' | wc -l
# → 0 が理想
```

## 出力契約

以下を返す:

1. `overall_score` / `max_score` (repo は 70 点満点)
2. カテゴリごとのスコア + 具体的な根拠
3. 失敗チェック項目と該当ファイルパス
4. Top 3 改善アクション
5. 次に適用を推奨する skill / 手順

## サンプル出力

```text
Harness Audit (repo): 55/70

Tool Coverage:        9/10   (skills 5, agents 2, commands 5 — 偏りなし)
Context Efficiency:   8/10   (description 平均 3-5 行、肥大なし)
Quality Gates:        5/10   (Stop hook 共有設定に未登録 / `/quality-gate` あり)
Memory Persistence:   5/10   (プロジェクト側 memory/ 未採用方針 = 既定値)
Eval Coverage:        7/10   (testing.md 網羅、Storybook 一部抜け)
Security Guardrails:  10/10  (SPDX 100%, locales OK, migrations clean)
Cost Efficiency:      8/10   (context-budget 導入済 / MCP 0)

Failed Checks:
- packages/frontend/src/.../X.vue で SPDX 欠落 (Security Guardrails)
- console.log が backend に 3 件 (Quality Gates)
- 共有 Stop hook なし (Quality Gates) — 各 contributor が `.claude/settings.local.json` で opt-in する方針なら減点しなくて良い

Top 3 Actions:
1) [Security Guardrails] SPDX 欠落 1 ファイルを修正:
   packages/frontend/src/.../X.vue
2) [Quality Gates] backend の console.log 3 件を logger に置換。
   git grep "console\.log" packages/backend/src
3) [Cost Efficiency] enabledPlugins から未使用のものを外す。
   .claude/docs/plugins.md と照合。

Suggested next skills to apply:
- /quality-gate で完了前に lint + unit test を回す
- context-budget で plugin 由来の overhead を確認
```

## 採点の信頼性

- 確定的: 同じ commit / 同じ `.claude/` 構成なら同じスコア
- ヒューリスティクス: 「description の冗長度」のような主観項目は同一基準で機械的に判定
- スクリプト不要: `pnpm` と `git`、`grep`/`find` 等の標準ツールのみ

## 参考: ECC オリジナルとの差分

- ECC 版は `node scripts/harness-audit.js` を直叩きする運用で、ECC リポジトリ全体に閉じた採点だった。
- Misskey 版は **Misskey の規約 (SPDX/migration/locales/endpoint-list)** を Security 採点に組み込み、`pnpm` ベースの実コマンドで根拠を取る方式に再設計。
- 結果として ECC への依存はゼロ。
