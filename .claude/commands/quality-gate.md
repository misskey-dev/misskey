---
description: Misskey の lint / typecheck / 高速テストを順に実行する任意の広域品質検証。
argument-hint: "[repo|backend|frontend|<path/to/file.ts>]"
---

<!--
SPDX-License-Identifier: MIT
SPDX-FileCopyrightText: 2026 Affaan Mustafa and everything-claude-code contributors

出典 (upstream): https://github.com/affaan-m/everything-claude-code (v2.0.0-rc.1)
upstream path: commands/quality-gate.md
upstream license: MIT — https://github.com/affaan-m/everything-claude-code/blob/main/LICENSE
project-level notice: see .claude/THIRD_PARTY_LICENSES.md (Misskey 内サードパーティ一覧 + MIT 全文)

Imported into Misskey .claude/ on 2026-05-10. Pipeline 概念 (lint → typecheck → test) は upstream ECC 版から借用 (MIT)。実コマンド層は Misskey の pnpm + tsc + ESLint + Vitest に固定し、formatter (Prettier/Biome) フェーズは削除した。

note: 元 ECC 版は言語自動判定 + format/lint/type のジェネリック版だったが、Misskey 専用に pnpm + tsc + ESLint + Vitest の組み合わせに固定。
重い test:e2e / test:fed は含めず、変更内容または明示依頼に応じて個別実行する。
-->

# /quality-gate — Misskey 広域品質検証

`/quality-gate [scope]`

package または repo 全体の状態が必要なときに任意で使う。
完了時に必須の変更ファイル lint は [shipping-misskey-change](../skills/shipping-misskey-change/SKILL.md) が担当する。

## Scope

- `repo` (default) — 全 workspace の lint + backend / frontend の unit test
- `backend` — `packages/backend` のみ
- `frontend` — `packages/frontend` のみ
- `path/to/file.ts` — 単一ファイルへの ESLint `--quiet` のみ

## Pipeline

### Repo scope

各パッケージの `lint` スクリプト実体は `pnpm typecheck && pnpm eslint` ([packages/backend/package.json](../../packages/backend/package.json), [packages/frontend/package.json](../../packages/frontend/package.json))。
ルートの `pnpm lint` は `pnpm --no-bail -r lint && pnpm check-dts` なので、そのまま実行すると workspace lint の失敗時に `check-dts` が実行されない。
次の 4 コマンドをそれぞれ独立した Bash 呼び出しとして実行し、先の失敗にかかわらず全結果を収集する:

```bash
pnpm --no-bail -r lint
pnpm check-dts
pnpm --filter backend test
pnpm --filter frontend test
```

#### 詳細を分けて見たい時のみ (optional)

lint がまとめて失敗していて typecheck の結果だけ単独で見たい場合は、以下を個別に回す。**通常は不要** (lint の出力を読めば足りる):

```bash
pnpm --filter backend typecheck    # tsc 単体
pnpm --filter frontend typecheck   # vue-tsc 単体 (Vue SFC の型を見るため)
```

### Backend scope

`pnpm --filter backend lint` は内部で `pnpm typecheck && pnpm eslint` を実行する ([packages/backend/package.json](../../packages/backend/package.json)) ので、`lint` を回せば typecheck も終わる。
広域検証では typecheck の二重実行を避けるため `lint` + `test` のみ:

```bash
pnpm --filter backend lint
pnpm --filter backend test
```

`tsc` の出力を単独で見たい時のみ optional で `pnpm --filter backend typecheck` を別途回す。

### Frontend scope

`pnpm --filter frontend lint` も内部で `pnpm typecheck && pnpm eslint` を実行する ([packages/frontend/package.json](../../packages/frontend/package.json)) ため、広域検証では Backend 同様に `lint` + `test` のみ:

```bash
pnpm --filter frontend lint
pnpm --filter frontend test
```

`vue-tsc` の出力を単独で見たい時のみ optional で `pnpm --filter frontend typecheck` を別途回す。

### Single file scope

repo-relative path を package-relative path に変換し、該当 package root で実行する。

```bash
(cd packages/backend && pnpm exec eslint --quiet -- src/path/to/file.ts)
(cd packages/frontend && pnpm exec eslint --quiet -- src/path/to/component.vue)
```

## Output

各コマンドの終了コードを保持し、実行項目を `PASS / FAIL / BASELINE / SKIPPED` で集計する。
`BASELINE` は同じ失敗が base 側でも再現し、今回の変更と無関係と確認できた場合だけ使う。

```text
Quality Gate (repo):

Lint:        PASS
Backend ut:  BASELINE (base 側でも同じ既存失敗)
Frontend ut: PASS
Other tests: SKIPPED (repo scope の対象外)
```

一つが失敗しても独立した残りの検証は続ける。
`BASELINE` を `PASS` と表示せず、未実行の項目は理由とともに `SKIPPED` とする。

## 関連 skill / コマンド

- [`shipping-misskey-change` スキル](../skills/shipping-misskey-change/SKILL.md) — commit / PR 直前の最終チェックリスト
- [`shipping-misskey-change/references/tasks/regenerate-misskey-js.md`](../skills/shipping-misskey-change/references/tasks/regenerate-misskey-js.md) — API 変更時の `pnpm build-misskey-js-with-types` 実行手順
- [.github/copilot-instructions.md §Validation コマンド](../../.github/copilot-instructions.md) — pnpm コマンド一覧 (Copilot / Codex 向けに再掲)

## 元 ECC 版との差分

- ジェネリックな言語自動判定を排除し、Misskey 固定 pipeline に。
- formatter フェーズなし (変更ファイル lint は ESLint `--quiet`)。
- e2e / federation / Playwright は scope に自動追加せず、変更内容または明示依頼に応じて個別実行。
