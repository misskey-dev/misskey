# Copilot Instructions for Misskey

このファイルは GitHub Copilot の repository-wide instructions として使われる。Copilot code review では `AGENTS.md` が読まれない環境があるため、レビューや軽微な実装判断に必要な規約はこのファイル単体で満たすこと。

リポジトリは Misskey の pnpm workspace モノレポ。主要な実装は `packages/backend` (NestJS / TypeORM) と `packages/frontend` (Vue 3) にある。より詳しいガイドはリポジトリルートの `AGENTS.md` を参照してよいが、このファイルの要件を省略してそちらへの参照だけで済ませないこと。

## 絶対にやってはいけない事

違反すると CI 失敗 / 本番事故 になる。

### コード・データ関連

- **SPDX ヘッダー必須**: AGPL-3.0-only 管轄かつ SPDX CI 対象ディレクトリに新規 `.ts` / `.js` / `.cjs` / `.mjs` / `.scss` / `.vue` / `.html` ファイルを追加する場合は冒頭に必ず付ける。詳細な対象判定は `.github/workflows/check-spdx-license-id.yml` を参照。

  ```text
  /*
   * SPDX-FileCopyrightText: syuilo and misskey-project
   * SPDX-License-Identifier: AGPL-3.0-only
   */
  ```

  新規 `.vue` / `.html` ファイルは HTML コメント形式で:

  ```text
  <!--
  SPDX-FileCopyrightText: syuilo and misskey-project
  SPDX-License-Identifier: AGPL-3.0-only
  -->
  ```

  `packages/misskey-js` は MIT ライセンスのサブパッケージなので、この AGPL ヘッダーを一律に付けない (サブパッケージ固有の `package.json` / `LICENSE` / 既存ファイルのヘッダーに従う)。

- **`locales/ja-JP.yml` 以外の locale YAML を編集しない**。他言語ファイル (`en-US.yml` など `ja-JP.yml` 以外すべて) は Crowdin の自動配信先で、手動編集すると次の同期で上書き喪失する。
- **マージ済 migration を編集しない**。`packages/backend/migration/{timestamp}-*.js` のうち既に `develop` / `master` に入ったものは絶対に変更しない。スキーマ変更が必要なら新しい timestamp で新規ファイルを追加し、`up()` と `down()` の両方を実装する。
- **secrets / 認証情報をリポジトリにコミットしない** (`.config/*.yml` の本番値、`.env` ファイル、API token、private key 等)。

### Git / リポジトリ操作

- `git push --force` / `--force-with-lease` を `main` / `develop` / `master` にしない
- `git commit --no-verify` で hook をスキップしない
- マージ済 / プッシュ済コミットを `git commit --amend` で書き換えない
- 他人のブランチを `git reset --hard` / `git branch -D` で破壊しない
- `git config` をユーザーに無断で書き換えない (特に `user.name` / `user.email` / `commit.gpgsign`)

### Issue / PR / 外部送信

- ユーザーの明示指示なしに PR を merge / close / force-push しない
- ユーザーの明示指示なしに external service (GitHub comments / Slack / メール 等) へ送信しない

## 変更を出す前の最低チェック

1. `pnpm lint` が通る (typecheck + eslint, 全パッケージ)
2. backend で `meta` / `paramDef` / `res` を変更した → `pnpm build-misskey-js-with-types` を実行し `packages/misskey-js/src/autogen/` の差分も commit に含めた
3. entity / migration を変更した → `pnpm --filter backend check-migrations` が pending DDL 0 件で通る / 新規 migration は `up()` と `down()` 両方実装済
4. 新規 `.ts` / `.js` / `.cjs` / `.mjs` / `.vue` / `.scss` / `.html` ファイルを追加した → SPDX ヘッダーを付けた
5. ユーザー影響のある変更 → `CHANGELOG.md` の `## Unreleased` 配下の該当サブセクション (`### General` / `### Client` / `### Server`) に `- <Feat|Enhance|Fix>: <概要>` を 1 行追記
6. `locales/` を編集した場合、`git diff --name-only develop -- 'locales/*.yml' | grep -v '^locales/ja-JP\.yml$'` が空 (ja-JP.yml 以外に差分が無い) ことを確認

## Validation コマンド

- 全体ビルド: `pnpm build`
- 全体 lint / typecheck: `pnpm lint`
- Backend unit test: `pnpm --filter backend test`
- Backend e2e test: `pnpm --filter backend test:e2e`
- Backend federation test: `pnpm --filter backend test:fed`
- Frontend test: `pnpm --filter frontend test`
- Migration 差分検査: `pnpm --filter backend check-migrations`
- `misskey-js` 再生成 (API 変更後必須): `pnpm build-misskey-js-with-types`

**注意:** backend テスト (`test` / `test:e2e` / `test:fed`) 実行前に `.config/test.yml` が必要。未作成の場合は `ncp .github/misskey/test.yml .config/test.yml` (または `cp .github/misskey/test.yml .config/test.yml`) を実行してから走らせる。各テストスクリプトが内部で `cross-env NODE_ENV=test pnpm compile-config` を呼ぶため、コピー済みであれば追加の compile-config は不要。

変更範囲に応じて最も近いコマンドから優先して検証し、必要なら全体コマンドに広げること。

## Editing hints

- Backend の API / migration / TypeORM 変更は `packages/backend` を見る
- Frontend の Vue コンポーネントやページ変更は `packages/frontend` を見る
- `AGENTS.md` 内の相対リンクはリポジトリルート起点で解決する想定

**補足:** `AGENTS.md` はより詳細な正典 (Codex / Claude Code が読み込む)。Copilot code review ではこのファイルが主な入口になる。両方が読まれる環境では `AGENTS.md` を補助情報として使ってよい。
