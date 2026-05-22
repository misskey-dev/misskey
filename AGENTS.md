# Misskey – AI Agent Guide

このファイルは Misskey リポジトリで動く AI コーディングエージェント (Claude Code / OpenAI Codex / GitHub Copilot 等) が共通で参照する **最低限のルールと索引**。次の 3 経路から参照・読み込みされる:

- **Claude Code**: ルート `CLAUDE.md` から `@AGENTS.md` で取り込まれる
- **OpenAI Codex**: ルート `AGENTS.md` を直接読み込む
- **GitHub Copilot**: `.github/copilot-instructions.md` (本ファイルを参照しつつ、Copilot code review 向けに必須規約を再掲するファイル) 経由で参照する

人間 contributor 向けの一般規約 (Issue / PR の出し方、ActivityPub 拡張など) は [CONTRIBUTING.md](CONTRIBUTING.md) を参照。本ファイルは AI が **コードを書く・直す** 際に踏み外してはいけない事項に絞っている。

---

## 事故直結ルール (必ず守る)

違反すると CI 失敗または本番事故になる。順守すること。

### 1. SPDX ヘッダー必須

AGPL-3.0-only 管轄かつ SPDX CI 対象ディレクトリに新規 `.ts` / `.js` / `.cjs` / `.mjs` / `.vue` / `.scss` / `.html` ファイルを追加する場合、冒頭に以下を必ず付ける。欠落すると CI (`spdx` ジョブ) が失敗する。CI の対象判定は [.github/workflows/check-spdx-license-id.yml](.github/workflows/check-spdx-license-id.yml) の `directories` 配列を参照 (`*.config.{ts,js,cjs,mjs}` と `*eslint*` は除外)。

`packages/misskey-js` は MIT ライセンスのサブパッケージなので、この AGPL ヘッダーを一律に付けない。サブパッケージ固有の `package.json` / `LICENSE` / 既存ファイルのヘッダーに従う。

`.ts` / `.js` / `.cjs` / `.mjs` / `.scss`:

```text
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
```

`.vue` / `.html` (HTML コメント形式):

```text
<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
```

### 2. locales/*.yml は `ja-JP.yml` のみ編集可

`locales/` 配下の YAML は **`ja-JP.yml` のみ手動編集してよい**。他言語ファイル (`en-US.yml` 等) は Crowdin の自動配信先で、手動編集すると上書きで失われる。根拠: `locales/README.md` (ja-JP.yml 以外を手動編集しない運用) と `crowdin.yml` (`ja-JP.yml` → `locales/%locale%.yml` の同期設定)。

### 3. マージ済み migration を絶対に編集しない

`packages/backend/migration/{unixMs}-{PascalName}.js` のうち、既に `develop` / `master` にマージ済みのファイルは **絶対に変更しない**。本番環境で履歴改変が起きると深刻なデータ不整合を引き起こす。

スキーマ変更が必要な場合は **新しいタイムスタンプで新規ファイル** を作成する:

- ファイル名: `node -e "console.log(Date.now())"` で UNIX ms を取得し、`{ms}-<descriptive-name>.js` として置く。命名スタイルは既存履歴で混在しており (`1716129964060-ChannelIdDenormalizedForMiPoll.js` のような PascalCase、`1721666053703-fixDriveUrl.js` のような camelCase、`1672704136584-remove-latestStatus.js` のような kebab-case)、変更を表す単一の英語名であれば良い。クラス名側は PascalCase + 13 桁タイムスタンプ (`class FixDriveUrl1721666053703 { ... }`) を必ず守ること。
- `up()` と `down()` の両方を必ず実装する (`down` は `up` の完全な巻き戻し)。
- `pnpm --filter backend check-migrations` を通す。これは **TypeORM schema builder で pending DDL を検出する** 検査 ([packages/backend/scripts/check_migrations_clean.js](packages/backend/scripts/check_migrations_clean.js))。エンティティの `@Column` / `@Entity` 変更が migration に取り込まれていないとここで検出される。タイムスタンプの順序自体を直接検査するわけではない (順序が壊れた場合の失敗は別経路で出る)。

エンティティ差分から TypeORM CLI で自動生成したい / `CREATE INDEX CONCURRENTLY` 等のオプションを使いたい場合は [.claude/skills/create-migration/SKILL.md](.claude/skills/create-migration/SKILL.md) を参照。手書き / CLI どちらの方式でも上記 3 点 (履歴改変禁止 / `up`+`down` / `check-migrations`) が満たせれば良い。

---

## 必須コマンド

| 用途 | コマンド |
| --- | --- |
| 全体ビルド | `pnpm build` |
| 開発サーバー (backend + frontend watch) | `pnpm dev` |
| Lint (typecheck + eslint, 全パッケージ) | `pnpm lint` (= `pnpm --no-bail -r lint`。最初の失敗で止まらず全パッケージの結果を収集する) |
| Backend unit test (Vitest) | `pnpm --filter backend test` |
| Backend e2e test | `pnpm --filter backend test:e2e` |
| Backend federation test | `pnpm --filter backend test:fed` |
| Frontend test (Vitest) | `pnpm --filter frontend test` |
| Cypress E2E (要 `start:test`) | `pnpm e2e` |
| Storybook dev (frontend) | `pnpm --filter frontend storybook-dev` |
| Migration 適用 | `pnpm migrate` |
| Migration ロールバック | `pnpm revert` |
| Migration の pending DDL 検査 (エンティティ差分の取り込み漏れ検出) | `pnpm --filter backend check-migrations` |
| `misskey-js` 再生成 (API 変更後必須) | `pnpm build-misskey-js-with-types` |

> Backend の TypeScript 型チェックは `pnpm --filter backend typecheck` (tsgo)。
> 個別ファイルへの ESLint --fix は `pnpm exec eslint --fix <path>`。
> **backend テスト (`test` / `test:e2e` / `test:fed`) 実行前に `.config/test.yml` が必要** (未作成だとテスト自体が起動しない)。コピー手順と詳細は [.claude/docs/testing.md §Backend 全般の前提](.claude/docs/testing.md#backend-全般の前提-configtestyml) を参照。

---

## CHANGELOG

ユーザー影響のある変更 (機能追加・修正・改善) は `CHANGELOG.md` の冒頭 `## Unreleased` セクションに 1 行追加する。リファクタリング等の内部変更は不要。

### セクション構造

`## Unreleased` 配下に **3 つのサブセクション** が用意されている:

- `### General` — 共通 / 横断的な変更
- `### Client` — `packages/frontend` 系
- `### Server` — `packages/backend` 系

### エントリ書式

該当サブセクションに `- <Prefix>: <概要>` の形式で追加。Prefix は先頭大文字。

```text
- Enhance: ノートの詳細表示での公開範囲の表示を改善
- Fix: 通知が約10秒遅延する問題を修正
- Feat: 新機能の追加
```

### 触ってはいけない範囲

- `## Unreleased` **以外** のセクション (過去リリース) は変更しない。
- `## Unreleased` の見出しと 3 つの空サブセクション骨格自体は維持する (リリーススクリプトが期待する構造)。

> 参考: コミットメッセージ側は `enhance(frontend): ...` / `fix(backend): ...` の小文字 + スコープ形式 ([CONTRIBUTING.md](CONTRIBUTING.md) 参照)。CHANGELOG とは書式が異なる点に注意。

---

## オンデマンド参照 (必要時に Read すること)

以下は AI が **作業対象に応じて必要なときだけ** 開く詳細ドキュメント。常時コンテキストには載せない。

| 何をしたい時 | 参照先 |
| --- | --- |
| パッケージ構成・依存関係を把握したい | [.claude/docs/architecture.md](.claude/docs/architecture.md) |
| `packages/backend` を編集する (NestJS / TypeORM / migration / API endpoint) | [.claude/docs/backend.md](.claude/docs/backend.md) |
| `packages/frontend` を編集する (Vue 3 / Mk* / i18n / SCSS module / `os.ts`) | [.claude/docs/frontend.md](.claude/docs/frontend.md) |
| テストを書く・走らせる (Vitest / Cypress / Storybook) | [.claude/docs/testing.md](.claude/docs/testing.md) |
| 有効化済 Claude Code プラグインの用途を確認 | [.claude/docs/plugins.md](.claude/docs/plugins.md) |

---

## ツール固有の補助ファイル

`.claude/` 配下は Claude Code 固有の skills / agents / slash commands を集約している (Codex / Copilot は読み飛ばしてよい):

- `.claude/skills/` — 繰り返しタスク用の skill 定義 (例: `add-api-endpoint`, `create-migration`)
- `.claude/agents/` — 専門レビューエージェント (例: `misskey-api-reviewer`, `vue-component-reviewer`)
- `.claude/commands/` — Claude Code のスラッシュコマンド (例: `/check-misskey-js`, `/changelog-add`)
- `.claude/docs/` — オンデマンド参照ドキュメント (上記の表で示したもの。Codex / Copilot からも内容自体は読める)
- `.claude/settings.json` — Claude Code の有効プラグイン (`enabledPlugins`) のみを記載した共有設定。hook は意図的に登録しない (各 contributor が `.claude/settings.local.json` で opt-in する方針)
- `.claude/settings.local.json` — 個人ローカル設定 (`.gitignore` 済)

サードパーティ由来 (everything-claude-code 由来の MIT ライセンスファイル等) の出典は [.claude/THIRD_PARTY_LICENSES.md](.claude/THIRD_PARTY_LICENSES.md) を参照。
