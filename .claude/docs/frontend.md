# Frontend (`packages/frontend`) 規約

Vue 3.5 + Vite + Storybook + Cypress E2E。

## コンポーネント命名

- 共有 / 再利用コンポーネントは **`Mk` プレフィックス** (例: `MkButton.vue`, `MkInput.vue`, `MkAbuseReport.vue`)。
- ページ単位のものは `packages/frontend/src/pages/` 配下に置く。

## SFC スタイル

Composition API + `<script setup lang="ts">` を基本とする (Options API は新規導入しない)。型宣言や module スコープのユーティリティを置きたい時は、setup ブロックと**併用**する形で追加の `<script lang="ts">` ブロックを置いて構わない (例: [`MkInput.vue`](../../packages/frontend/src/components/MkInput.vue) は `SupportedTypes` 型を別ブロックで宣言してから setup を書いている)。SCSS は **CSS Modules** で書き、`<style lang="scss" module>` を使う:

```vue
<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
  <div :class="$style.root">
    <!-- ... -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
// ...
</script>

<style lang="scss" module>
.root {
  /* ... */
}
</style>
```

## 国際化 (i18n)

- 文字列リテラルを直書きしない。
- 引数なし: `i18n.ts.<path>` で参照する (例: `i18n.ts.deleted`)。
- 引数あり: `i18n.tsx.<path>(...)` で関数呼び出しする (例: `i18n.tsx.takeOverConfirm({ name })`)。
- 新規キーは **`locales/ja-JP.yml` のみ** に追加する (他言語は Crowdin で自動配信)。
- `i18n` は `packages/frontend/src/i18n.ts` (または共有モジュール) から import する。

## モーダル / 通知

- `os.ts` (`packages/frontend/src/os.ts`) 経由で呼ぶ。
- `os.alert(...)` / `os.confirm(...)` / `os.popup(...)` / `os.success(...)` など。
- ブラウザ標準の `window.alert()` / `window.confirm()` を **直接呼ばない**。

## アクセシビリティ (PR レビューで指摘されやすい点)

- クリックハンドラを付けるなら `<button>` を使うか、`role="button"` + `tabindex` を付ける。
- フォーム要素には `<label>` または `aria-label` を付ける。
- キーボード操作可能であること。

## Storybook

新規共有コンポーネントには `<ComponentName>.stories.impl.ts` を併設するのが慣習 (`MkButton.stories.impl.ts` 等の例多数)。

```bash
pnpm --filter frontend storybook-dev    # localhost:6006
```

## ビルド・開発

- 開発: `pnpm dev` (ルート) で backend + frontend が watch で立ち上がる。
- ビルド: `pnpm --filter frontend build`
- 型チェック: `pnpm --filter frontend typecheck` (vue-tsc)
- ESLint: `pnpm --filter frontend eslint`

## テスト

- Unit (Vitest): `pnpm --filter frontend test`
- Cypress E2E: `pnpm e2e` (ルートから; `start-server-and-test` で起動)
