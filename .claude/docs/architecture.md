# アーキテクチャ概要

## モノレポ構成 (pnpm workspaces)

pnpm workspace の正は [pnpm-workspace.yaml](../../pnpm-workspace.yaml) で、以下 11 パッケージと、`packages/misskey-js` 内の sub-workspace `packages/misskey-js/generator` (型生成用の内部ジェネレータ。直接編集しない) で構成される。`package.json` の `workspaces` 配列も併記しているが、実体は pnpm-workspace.yaml が読まれる:

| パッケージ | 役割 |
|---|---|
| `packages/backend` | NestJS 11 + Fastify 5 + TypeORM 0.3 (PostgreSQL) + Redis。HTTP/WebSocket/ActivityPub サーバー本体。 |
| `packages/frontend` | Vue 3.5 + Vite。Web クライアント本体。 |
| `packages/frontend-embed` | 埋め込み専用ビュー (ノート単体プレビュー等)。 |
| `packages/frontend-shared` | frontend と frontend-embed で共有するユーティリティ・コンポーネント。 |
| `packages/frontend-builder` | フロントエンドビルド支援 (Vite plugin など)。 |
| `packages/sw` | Service Worker。 |
| `packages/misskey-js` | JS/TS クライアント SDK (MIT サブパッケージ)。`src/autogen/` 配下のみ backend の OpenAPI から `pnpm build-misskey-js-with-types` で自動生成され、それ以外 (`src/index.ts` / `src/api.ts` 等) は手書き保守する。autogen 配下を直接編集しないこと。 |
| `packages/misskey-reversi` | 内蔵リバーシゲームのロジック。 |
| `packages/misskey-bubble-game` | 内蔵バブルゲームのロジック。 |
| `packages/i18n` | locales 読み込み/型生成のサポート。 |
| `packages/icons-subsetter` | アイコンのサブセット化ツール。 |

その他に `packages/shared` (workspaces には含まれないが共有ファイル置き場) もある。

## 重要な依存関係

```
frontend ── misskey-js (auto-generated) ── backend (OpenAPI)
                ▲
                └── frontend-embed, sw も依存
```

- backend の API (meta / paramDef / response) を変更したら **必ず** `pnpm build-misskey-js-with-types` を実行し、misskey-js の生成物を更新する。忘れると CI の `check-misskey-js-autogen` ジョブが落ちる。

## ビルドツール

- **Backend**: `rolldown` (Rust 製・Rollup 互換 API のバンドラ) でバンドル。型チェックは `tsgo` (TypeScript native preview)。
- **Frontend**: Vite。型チェックは `vue-tsc`。
- **Lint**: ESLint 9 (Flat Config) + `@misskey-dev/eslint-plugin`。

## 国際化

- `locales/` 直下に 40 言語の YAML (ja-JP.yml + 他 39 言語)。
- **`ja-JP.yml` のみ手動編集可** (Crowdin 経由で他言語へ自動配信)。
- フロントエンドからの参照は引数なしか引数ありかで使い分ける。詳細は [frontend.md](./frontend.md#国際化-i18n)。

## ライセンス

リポジトリ本体は AGPL-3.0-only。**AGPL-3.0-only 管轄かつ SPDX CI 対象ディレクトリ** の新規 `.ts` / `.js` / `.cjs` / `.mjs` / `.vue` / `.scss` / `.html` ファイルには冒頭に SPDX ヘッダー必須。`packages/misskey-js` は MIT サブパッケージなので AGPL ヘッダーを一律に付けない。条件と除外の詳細は [AGENTS.md §1](../../AGENTS.md#1-spdx-ヘッダー必須) 参照。
