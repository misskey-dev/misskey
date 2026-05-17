# Copilot Instructions for Misskey

このファイルは GitHub Copilot の repository-wide instructions として使われる。Copilot code review では `AGENTS.md` が読まれない環境があるため、レビューや軽微な実装判断に必要な規約はこのファイル単体で満たすこと。

このリポジトリは Misskey の pnpm workspace モノレポ。主要な実装は `packages/backend` (NestJS / TypeORM) と `packages/frontend` (Vue 3) にある。より詳しいガイドはリポジトリルートの `AGENTS.md` を参照してよいが、このファイルの要件を省略してそちらへの参照だけで済ませないこと。

## Always follow

- AGPL-3.0-only 管轄かつ SPDX CI 対象ディレクトリに新規 `.ts` / `.js` / `.cjs` / `.mjs` / `.scss` ファイルを追加する場合は、必ず次の SPDX ヘッダーを付ける。詳細な対象判定は `AGENTS.md` と `.github/workflows/check-spdx-license-id.yml` を参照すること。

```text
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
```

- AGPL-3.0-only 管轄かつ SPDX CI 対象ディレクトリに新規 `.vue` / `.html` ファイルを追加する場合は、必ず次の SPDX ヘッダーを付ける。

```text
<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
```

`packages/misskey-js` は MIT ライセンスのサブパッケージなので、この AGPL ヘッダーを一律に付けない。サブパッケージ固有の `package.json` / `LICENSE` / 既存ファイルのヘッダーに従う。

- `locales/` 配下の YAML は `ja-JP.yml` のみ手動編集してよい。他言語は Crowdin の自動配信先なので手動編集しないこと。
- `packages/backend/migration/{timestamp}-*.js` のうち、既にマージ済みの migration は絶対に編集しない。スキーマ変更が必要な場合は新しい timestamp で migration を追加し、`up()` と `down()` の両方を実装すること。
- ユーザー影響のある変更は `CHANGELOG.md` の `## Unreleased` 配下の `### General` / `### Client` / `### Server` のいずれかに 1 行追加する。内部リファクタのみなら不要。
- API 変更時は `pnpm build-misskey-js-with-types` の実行が必要になる。

## Validation

- 全体ビルド: `pnpm build`
- 全体 lint / typecheck: `pnpm lint`
- Backend unit test: `pnpm --filter backend test`
- Backend e2e test: `pnpm --filter backend test:e2e`
- Backend federation test: `pnpm --filter backend test:fed`
- Frontend test: `pnpm --filter frontend test`
- Migration 差分検査: `pnpm --filter backend check-migrations`

> **backend テスト (`test` / `test:e2e` / `test:fed`) 実行前に `.config/test.yml` が必要。** 未作成の場合は `ncp .github/misskey/test.yml .config/test.yml` (または `cp .github/misskey/test.yml .config/test.yml`) を実行してから走らせる。各テストスクリプトが内部で `cross-env NODE_ENV=test pnpm compile-config` を呼ぶため、コピー済みであれば追加の compile-config は不要。

変更範囲に応じて最も近いコマンドから優先して検証し、必要なら全体コマンドに広げること。

## Editing hints

- Backend の API / migration / TypeORM 変更は `packages/backend` を見る。
- Frontend の Vue コンポーネントやページ変更は `packages/frontend` を見る。
- `AGENTS.md` 内の相対リンクはリポジトリルート起点で解決する想定。

> `AGENTS.md` はより詳細な正典だが、Copilot code review ではこのファイルが主な入口になる。両方が読まれる環境では `AGENTS.md` を補助情報として使ってよい。
