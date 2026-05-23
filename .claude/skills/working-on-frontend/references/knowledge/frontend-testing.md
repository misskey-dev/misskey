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

ルートから実行する:

```bash
pnpm e2e                # start:test サーバーを立てて Cypress run
pnpm cy:open            # 対話的に開く
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

## ローカル DB / Redis (テスト・開発共通)

```bash
docker compose -f compose.local-db.yml up -d
```

frontend だけでも backend に繋がる場合があるため、ローカル DB を立てておくのが無難。
