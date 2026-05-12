# テスト構成

## Backend 全般の前提: `.config/test.yml`

backend のテストスクリプト (`test` / `test:e2e` / `test:fed`) はすべて内部で `cross-env NODE_ENV=test pnpm compile-config` を実行し、`.config/test.yml` を読み込む ([packages/backend/package.json](../../packages/backend/package.json), [packages/backend/scripts/compile_config.js](../../packages/backend/scripts/compile_config.js))。**未作成だとテスト自体が起動しない。**

未作成なら以下を 1 回だけ手動コピーする (どちらでも可):

```bash
ncp .github/misskey/test.yml .config/test.yml
# または
cp .github/misskey/test.yml .config/test.yml
```

補足:

- ルートの `pnpm start:test` (Cypress 用にテストサーバーを起動するコマンド) を使う経路では実行時に `ncp` で自動コピーされる ([package.json](../../package.json))。それ以外で backend テストを直接走らせる時は上記の手動コピーが必要。
- すでに `.config/test.yml` があれば各テストスクリプトの内部 `compile-config` で十分なので、追加で `pnpm --filter backend compile-config` を叩く必要はない。
- `pnpm start:test` は backend e2e テスト (`pnpm --filter backend test:e2e`) の前提ではない (ポート競合の元になるため使わないこと)。

## Backend (Vitest 4, 3 設定)

| 種別 | 設定ファイル | 実行コマンド |
| --- | --- | --- |
| Unit | `packages/backend/vitest.config.unit.ts` | `pnpm --filter backend test` |
| E2E (HTTP / DB) | `packages/backend/vitest.config.e2e.ts` | `pnpm --filter backend test:e2e` |
| Federation | `packages/backend/vitest.config.fed.ts` | `pnpm --filter backend test:fed` |

- 配置: `packages/backend/test/`
- 事前準備は [§Backend 全般の前提: `.config/test.yml`](#backend-全般の前提-configtestyml) を参照。
- カバレッジ: `pnpm --filter backend test-and-coverage`

## Frontend (Vitest)

```bash
pnpm --filter frontend test                # 1 回実行
pnpm --filter frontend test-and-coverage   # カバレッジ付き
```

- 主な配置: `packages/frontend/test/*.test.ts` (例: `i18n.test.ts`, `theme.test.ts`, `is-birthday.test.ts`)。
- ビルドツール周りなど対象コードと隣接させた方が分かりやすいテストは、コードと同じディレクトリに `*.test.ts` として置く (例: [`packages/frontend/lib/rollup-plugin-unwind-css-module-class-name.test.ts`](../../packages/frontend/lib/rollup-plugin-unwind-css-module-class-name.test.ts))。
- 共有コンポーネント (`MkX.vue`) のユニットテストは現状少なく、`*.spec.ts` / `__tests__/` 形式は採用していない (Storybook + Cypress でカバー)。

## E2E (Cypress)

ルートから実行する:

```bash
pnpm e2e                # start:test サーバーを立てて Cypress run
pnpm cy:open            # 対話的に開く
```

- 設定: ルート `cypress.config.ts`。テスト本体は `cypress/` 配下。

## Storybook (frontend)

```bash
pnpm --filter frontend storybook-dev      # http://localhost:6006
pnpm --filter frontend build-storybook    # 静的ビルド
```

- 各コンポーネント横に `*.stories.impl.ts` を併設する慣習 (例: `MkButton.stories.impl.ts`)。
- Chromatic (`pnpm --filter frontend chromatic`) で視覚回帰チェック。

## ローカル DB / Redis (テスト・開発共通)

```bash
docker compose -f compose.local-db.yml up -d
```
