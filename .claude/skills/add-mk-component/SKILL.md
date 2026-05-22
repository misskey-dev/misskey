---
name: add-mk-component
description: Misskey フロントエンドの新規 Vue 3 コンポーネントを追加する。Mk* 命名 / SPDX (HTML コメント) / <script setup lang="ts"> / <style lang="scss" module> / *.stories.impl.ts 併設の規約をまとめて適用する。新しい共有 UI コンポーネントを packages/frontend/src/components/ に作る時に使う。
---

# Misskey Vue コンポーネント追加スキル

`packages/frontend/src/components/` に新しい共有コンポーネントを追加するための規約。

## 大前提

- 共有 / 再利用コンポーネントは **必ず `Mk` プレフィックス** (例: `MkButton`, `MkInput`)。ページ固有部品など `Mk` プレフィックスでないものは原則 `pages/` 側に置く。
- 新規では `<style lang="scss" module>` (CSS Modules) を既定とする。古い `scoped` 形式が混在しているが、新規では使わない。
- 文字列リテラルの直書きは禁止。文言は必ず `i18n.ts.<key>` 経由で参照する (新キーは `add-i18n-key` スキルを参照)。
- `alert()` / `confirm()` / `window.prompt()` は使わない。`os.alert` / `os.confirm` / `os.popup` などを使う。

## ステップ 1: ファイル配置

`packages/frontend/src/components/Mk<Name>.vue` に新規作成する。

ストーリーが必要 (= ほぼ常に必要) なら、同階層に `Mk<Name>.stories.impl.ts` も作る。Storybook の規約は `*.stories.impl.ts` であって、`*.stories.ts` ではない。

## ステップ 2: SPDX ヘッダー (HTML コメント形式)

`.vue` ファイル冒頭に必須:

```html
<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
```

`/* ... */` (TS / JS 形式) ではなく **HTML コメント** で書くこと。既存の `.vue` ファイルがすべて HTML コメント形式を使っており、SFC の先頭として自然な形式に統一するため (CI の `spdx` ジョブはコメント形式ではなく SPDX 文字列の有無のみを検査する)。

## ステップ 3: 最小テンプレート

[MkInfo.vue](../../../packages/frontend/src/components/MkInfo.vue) をベースにする (シンプルな表示コンポーネント):

```vue
<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<slot></slot>
</div>
</template>

<script lang="ts" setup>
const props = defineProps<{
	variant?: 'primary' | 'secondary';
}>();

const emit = defineEmits<{
	(ev: 'click'): void;
}>();
</script>

<style lang="scss" module>
.root {
	padding: 12px 14px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
}
</style>
```

### 規約ポイント

| 項目 | 規約 |
|---|---|
| `<script>` | `<script lang="ts" setup>`。型パラメータが必要なら `generic="T extends ..."` を付ける ([MkInput.vue 参照](../../../packages/frontend/src/components/MkInput.vue)) |
| `defineProps` / `defineEmits` | **type-only** (`<{ ... }>`) 形式。runtime の object 形式は使わない |
| `<style>` | `lang="scss" module` を既定。クラス参照は `:class="$style.foo"` |
| CSS 変数 | `var(--MI_THEME-...)` (テーマ) / `var(--MI-radius)` (UI 共通) — ハードコードしない |
| アイコン | Tabler icons のクラス (`<i class="ti ti-info-circle">`) を使う |

## ステップ 4: i18n と os の利用

```vue
<script lang="ts" setup>
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';

async function onClick() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts._notes.deleteConfirm,
	});
	if (canceled) return;
	os.toast(i18n.ts.deleted);
}
</script>
```

### `os` の主なヘルパー (詳細は [os.ts](../../../packages/frontend/src/os.ts))

| 関数 | 用途 |
|---|---|
| `os.alert({ type, title?, text })` | 単方向アラート |
| `os.confirm({ type, title, text })` | yes/no 確認 (`{ canceled }` を返す) |
| `os.toast(message)` | 一時通知 |
| `os.popup(component, props, handlers)` | 任意コンポーネントの非同期ポップアップ |
| `os.popupMenu(items, anchor?)` | コンテキストメニュー |
| `os.form(title, fields)` | フォームダイアログ |
| `os.apiWithDialog(endpoint, data)` | API 呼出し + エラー時ダイアログ表示 |

## ステップ 5: Storybook ストーリー併設

[MkButton.stories.impl.ts](../../../packages/frontend/src/components/MkButton.stories.impl.ts) を雛形として参考にする。`.stories.impl.ts` も `packages/frontend/src/` 配下の `.ts` ファイルなので [AGENTS.md §1 SPDX ヘッダー必須](../../../AGENTS.md#1-spdx-ヘッダー必須) の対象であり、冒頭に SPDX ヘッダーを必ず付ける (HTML コメント形式ではなく `/* */` 形式)。形式 (以下の `MkXxx` は実際のコンポーネント名に置換する):

```ts
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import type { StoryObj } from '@storybook/vue3';
import MkXxx from './MkXxx.vue';

export const Default = {
	render(args) {
		return {
			components: { MkXxx },
			setup() {
				return { args };
			},
			template: '<MkXxx v-bind="args">slot content</MkXxx>',
		};
	},
	args: {
		variant: 'primary',
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkXxx>;
```

`Vue` SFC は default export なので、`import MkXxx from './MkXxx.vue';` のように名前付き import ではなく default import で書く。実行確認は `pnpm --filter frontend storybook-dev`。

## ステップ 6: Lint と typecheck

```bash
pnpm --filter frontend lint
```

(typecheck = vue-tsc 等、ESLint = `@misskey-dev/eslint-plugin` 含む)

ESLint --fix をピンポイントで:

```bash
pnpm exec eslint --fix packages/frontend/src/components/Mk<Name>.vue
```

## ステップ 7: 既存コンポーネントとの整合性確認

- 似た用途の既存 `Mk*` コンポーネントを参考に、スタイルやプロップ命名を揃える。
- `_button` / `_panel` / `_selectable` などの **共通 utility class** (グローバルスタイルにある) を活用できるか確認する。
- 大きな機能なら、Storybook stories で各バリエーションを網羅する。

## 参照ファイル

- [MkInfo.vue (シンプル例)](../../../packages/frontend/src/components/MkInfo.vue)
- [MkButton.vue (汎用ボタン例)](../../../packages/frontend/src/components/MkButton.vue)
- [MkInput.vue (generics + 多機能例)](../../../packages/frontend/src/components/MkInput.vue)
- [MkButton.stories.impl.ts (Storybook 雛形)](../../../packages/frontend/src/components/MkButton.stories.impl.ts)
- [packages/frontend/src/os.ts](../../../packages/frontend/src/os.ts)
- [packages/frontend/src/i18n.ts](../../../packages/frontend/src/i18n.ts)
