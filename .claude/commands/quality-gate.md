---
description: Misskey の lint / typecheck / 高速テストを順に実行して品質ゲートを通すコマンド。完了前の軽量検証用。
argument-hint: "[repo|backend|frontend|<path/to/file.ts>]"
---

<!--
SPDX-License-Identifier: MIT
SPDX-FileCopyrightText: 2026 Affaan Mustafa and everything-claude-code contributors

出典 (upstream): https://github.com/affaan-m/everything-claude-code (v2.0.0-rc.1)
upstream path: commands/quality-gate.md
upstream license: MIT — https://github.com/affaan-m/everything-claude-code/blob/main/LICENSE
project-level notice: see .claude/THIRD_PARTY_LICENSES.md (Misskey 内サードパーティ一覧 + MIT 全文)

Imported into Misskey .claude/ on 2026-05-10. Pipeline 概念 (lint → typecheck → test) は upstream ECC 版から借用 (MIT)。実コマンド層は Misskey の pnpm + tsgo + ESLint + Vitest に固定し、formatter (Prettier/Biome) フェーズは削除した。

note: 元 ECC 版は言語自動判定 + format/lint/type のジェネリック版だったが、Misskey 専用に pnpm + tsgo + ESLint + Vitest の組み合わせに固定。重い test:e2e / test:fed は含まない (CI 側で実行される)。
-->

# /quality-gate — Misskey 軽量品質ゲート

`/quality-gate [scope]`

完了前の **軽量** 品質チェック。重い E2E / 連合テスト (test:e2e / test:fed / Cypress) は CI 側で実行されるため、本コマンドには含めない。

## Scope

- `repo` (default) — 全パッケージ
- `backend` — `packages/backend` のみ
- `frontend` — `packages/frontend` のみ
- `path/to/file.ts` — 単一ファイルへの ESLint --fix のみ

## Pipeline

### Repo scope (全部)

各パッケージの `lint` スクリプト実体は `pnpm typecheck && pnpm eslint` ([packages/backend/package.json](../../packages/backend/package.json), [packages/frontend/package.json](../../packages/frontend/package.json)) で、ルートの `pnpm lint` は `pnpm --no-bail -r lint` (= 全パッケージで lint を `--no-bail` で実行)。**typecheck は lint に含まれている**ため、通常はこの 2 コマンドで十分:

```bash
# 1. Lint (= typecheck + ESLint、全パッケージ。--no-bail で最初の失敗で止まらず全結果を集める)
pnpm lint

# 2. Unit test (高速、e2e は含まない)
pnpm --filter backend test
pnpm --filter frontend test
```

#### 詳細を分けて見たい時のみ (optional)

lint がまとめて失敗していて typecheck の結果だけ単独で見たい場合は、以下を個別に回す。**通常は不要** (lint の出力を読めば足りる):

```bash
pnpm --filter backend typecheck    # tsgo 単体
pnpm --filter frontend typecheck   # vue-tsc 単体 (Vue SFC の型を見るため)
```

### Backend scope

`pnpm --filter backend lint` は内部で `pnpm typecheck && pnpm eslint` を実行する ([packages/backend/package.json](../../packages/backend/package.json)) ので、`lint` を回せば typecheck も終わる。軽量ゲートでは typecheck の二重実行を避けるため `lint` + `test` のみ:

```bash
pnpm --filter backend lint
pnpm --filter backend test
```

`tsgo` の出力を単独で見たい時のみ optional で `pnpm --filter backend typecheck` を別途回す。

### Frontend scope

`pnpm --filter frontend lint` も内部で `pnpm typecheck && pnpm eslint` を実行する ([packages/frontend/package.json](../../packages/frontend/package.json)) ため、軽量ゲートでは Backend 同様に `lint` + `test` のみ:

```bash
pnpm --filter frontend lint
pnpm --filter frontend test
```

`vue-tsc` の出力を単独で見たい時のみ optional で `pnpm --filter frontend typecheck` を別途回す。

### Single file scope

```bash
pnpm exec eslint --fix <path>
```

## Output

実行したフェーズの pass/fail と件数を集計する。標準パイプラインは `pnpm lint` (typecheck 内包) と unit test のみなので、デフォルトの出力は以下のようになる:

```text
Quality Gate (repo):

Lint:        PASS  (0 errors, 2 warnings)
Backend ut:  PASS  (412/412)
Frontend ut: PASS  (87/87)

→ 完了前の軽量チェック OK。重い e2e / 連合テストは CI 側で実行される。
```

`#### 詳細を分けて見たい時のみ (optional)` で個別 typecheck (`pnpm --filter backend typecheck` / `pnpm --filter frontend typecheck`) も回した場合のみ、その結果を追加行として表示する:

```text
Quality Gate (repo):

Lint:        PASS  (0 errors, 2 warnings)
Backend tc:  PASS  (0 errors)        # optional 実行時のみ
Frontend tc: PASS  (0 errors)        # optional 実行時のみ
Backend ut:  PASS  (412/412)
Frontend ut: PASS  (87/87)
```

失敗時は最初に落ちたフェーズで停止して詳細を見せる。

## 関連 skill / コマンド

- `/check-misskey-js` コマンド — API 変更時の misskey-js 再生成
- [AGENTS.md §必須コマンド](../../AGENTS.md#必須コマンド) — pnpm コマンド一覧の正典

## 元 ECC 版との差分

- ジェネリックな言語自動判定を排除し、Misskey 固定 pipeline に。
- formatter フェーズなし (Misskey は ESLint --fix のみ採用)。
- e2e / federation / Cypress は重いため除外し CI 側に委譲。
