# Frontend テスト (Vitest / Cypress)

Misskey frontend のテスト構成。

## Vitest (unit)

```bash
pnpm --filter frontend test                # 1 回実行
pnpm --filter frontend test-and-coverage   # カバレッジ付き
```

### 配置

- 主な配置: `packages/frontend/test/*.test.ts` (例: `i18n.test.ts`, `theme.test.ts`, `is-birthday.test.ts`)
- ビルドツール周りなど対象コードと隣接させた方が分かりやすいテストは、コードと同じディレクトリに `*.test.ts` として置く (例: [packages/frontend/lib/rollup-plugin-unwind-css-module-class-name.test.ts](../../../../../packages/frontend/lib/rollup-plugin-unwind-css-module-class-name.test.ts))
- 共有コンポーネント (`MkX.vue`) のユニットテストは現状少なく、`*.spec.ts` / `__tests__/` 形式は採用していない (Storybook + Cypress でカバー)

## Cypress E2E

Cypress は **起動済みのテストサーバー** に対して走るため、unit より前提が多い。[.github/workflows/test-frontend.yml](../../../../../.github/workflows/test-frontend.yml) の `e2e` ジョブと同じ手順をローカルで踏む:

```bash
# 1. テスト用 DB / Redis を起動 (テスト用ポート。開発用の compose.local-db.yml ではない)
docker compose -f packages/backend/test/compose.yml up -d

# 2. テスト設定を配置 (未作成なら。例示なので、cpコマンドは環境にあったコマンドに適宜読み替えること)
cp .github/misskey/test.yml .config/test.yml

# 3. 全体ビルド
pnpm build

# 4. テストサーバー起動 + Cypress 実行 (いずれもルートから)
pnpm e2e                # 内部で pnpm start:test を起動し http://localhost:61812 を待って Cypress run
pnpm cy:open            # 対話的に開く (サーバーは別途 pnpm start:test で起動しておく)
```

- 設定: ルート [cypress.config.ts](../../../../../cypress.config.ts)
- テスト本体は [cypress/](../../../../../cypress/) 配下

新規 frontend 機能の E2E は Cypress に書くのが基本。ただし対象は主要 UI フロー (login / post / drive etc) に限定し、細かい単位テストは Vitest または Storybook で代替する慣習。

## Storybook (視覚確認 + Chromatic 視覚回帰)

詳細は → [storybook.md](storybook.md)。

```bash
pnpm --filter frontend storybook-dev      # http://localhost:6006
pnpm --filter frontend build-storybook    # 静的ビルド
```

各コンポーネント横に `*.stories.impl.ts` を併設する慣習 (例: `MkButton.stories.impl.ts`)。Chromatic (`pnpm --filter frontend chromatic`) で視覚回帰チェック。

## ローカル DB / Redis

frontend のテスト種別で DB / Redis の要否が違う:

- **Vitest (unit)** — DB 不要。ロジック / コンポーネント単体のテストで backend に繋がない (CI の `vitest` ジョブにも `services:` は無い)
- **Cypress (E2E)** — テストサーバー (`pnpm start:test`) 経由で backend に繋ぐため DB / Redis が必要。**テスト用ポートの [packages/backend/test/compose.yml](../../../../../packages/backend/test/compose.yml)** を使う (上記 Cypress E2E の手順を参照)

開発用の `compose.local-db.yml` (db `5432` / redis `6379`) は **テストには使わない**。テスト用の `packages/backend/test/compose.yml` (`54312` / `56312`) とはポートが異なり、混同すると接続できない。
