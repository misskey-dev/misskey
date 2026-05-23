# 新規 / 既存 `Mk*` Vue コンポーネントを追加・改修する

`packages/frontend/src/components/` 配下に新規の共有 Vue 3 SFC を追加する、または既存コンポーネントを大きく改修する時の手順。同じ規約をレビュー側からチェックする agent が [.claude/agents/vue-component-reviewer.md](../../../../agents/vue-component-reviewer.md)。

## 大前提 (事故直結 / Critical)

1. **SPDX ヘッダー** — `.vue` は HTML コメント形式 `<!-- ... -->`、`.stories.impl.ts` は TS コメント形式 `/* ... */`。欠落すると CI (`spdx` ジョブ) が落ちる
2. **`Mk` プレフィックス必須** — 共有コンポーネントは `MkButton.vue` / `global/MkAvatar.vue` のように `Mk` で始める。ページ固有 UI は `Mk` を付けず `pages/` 側に置く
3. **`locales/ja-JP.yml` のみ編集可** — i18n キー追加時に他言語 (`en-US.yml` 等) を手で触ってはいけない。Crowdin の自動配信で上書きされて失われる。詳細は [tasks/adding-i18n-key.md](adding-i18n-key.md) を参照
4. **文字列リテラルの直書き禁止** — テンプレート / JS どちらでも、ユーザーに見せる文言は必ず `i18n.ts.<key>` か `i18n.tsx.<key>(...)` 経由 → [knowledge/i18n-usage.md](../knowledge/i18n-usage.md)
5. **ブラウザ標準 UI を直接呼ばない** — `alert()` / `confirm()` / `window.prompt()` は禁止、必ず `os.alert` / `os.confirm` / `os.popup` 経由 → [knowledge/os-api.md](../knowledge/os-api.md)

## ファイル配置

| 配置先 | 用途 | 命名 |
|---|---|---|
| `packages/frontend/src/components/Mk<Name>.vue` | 通常の共有 UI コンポーネント | `Mk<Name>.vue` |
| `packages/frontend/src/components/global/Mk<Name>.vue` | アプリ全域から `<script setup>` の自動 import で参照される基本部品 (`MkA` / `MkAvatar` / `MkAcct` 等) | `Mk<Name>.vue` (サブディレクトリ内でも `Mk` prefix 必須) |
| `packages/frontend/src/components/grid/Mk<Name>.vue` | テーブル/グリッド系の部品セット | 同上 |
| `packages/frontend/src/pages/<Name>.vue` | 単一ページ専用の UI (再利用しない) | `Mk` prefix **不要** |

迷ったら「他の `Mk*.vue` から import される可能性があるか?」で判定する。Yes なら `components/`、No なら `pages/`。

ストーリーが必要 (= ほぼ常に必要) なら、同階層に `Mk<Name>.stories.impl.ts` も作る → [knowledge/storybook.md](../knowledge/storybook.md)。

## SPDX ヘッダー

### `.vue` ファイル (HTML コメント)

```html
<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
```

`/* ... */` (TS / JS 形式) は **使わない**。既存の `.vue` ファイルがすべて HTML コメント形式を採用しており、SFC 先頭として自然な形式に統一するため。

### `.stories.impl.ts` ファイル (TS コメント)

```ts
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
```

## 最小テンプレート

[MkInfo.vue](../../../../../packages/frontend/src/components/MkInfo.vue) を参考にしたシンプルな表示コンポーネントの最小形:

```vue
<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, $style[`variant_${variant}`]]">
	<slot></slot>
	<button
		v-if="closable"
		class="_button"
		:class="$style.close"
		:aria-label="i18n.ts.close"
		@click="emit('close')"
	>
		<i class="ti ti-x"></i>
	</button>
</div>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n.js';

const props = withDefaults(defineProps<{
	variant?: 'info' | 'warn' | 'danger';
	closable?: boolean;
}>(), {
	variant: 'info',
});

const emit = defineEmits<{
	(ev: 'close'): void;
}>();
</script>

<style lang="scss" module>
.root {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 14px;
	border-radius: var(--MI-radius);
}

.variant_info {
	background: var(--MI_THEME-infoBg);
	color: var(--MI_THEME-infoFg);
}

.variant_warn {
	background: var(--MI_THEME-infoWarnBg);
	color: var(--MI_THEME-infoWarnFg);
}

.variant_danger {
	background: var(--MI_THEME-error);
	color: var(--MI_THEME-fgOnAccent);
}

.close {
	margin-left: auto;
}
</style>
```

より複雑なケース (型ジェネリック / 2 ブロック script / `v-model` 連動 / 名前付き slot) は → [knowledge/component-conventions.md §テンプレート集](../knowledge/component-conventions.md)。

## `<script>` / `<style>` 規約サマリ

| 項目 | 規約 | 新規不可 |
|---|---|---|
| `<script>` 開始タグ | `<script lang="ts" setup>` または `<script setup lang="ts">` | `<script>` (lang 無し) / Options API |
| Props 定義 | `defineProps<{ ... }>()` (type-only) | runtime object 形式 |
| Emits 定義 | `defineEmits<{ (ev: 'click'): void }>()` (type-only) | runtime array 形式 |
| `<style>` 開始タグ | `<style lang="scss" module>`、参照は `:class="$style.foo"` | `<style scoped>` (module なし) |
| CSS 値 | `var(--MI_THEME-...)` / `var(--MI-...)` | `#fff` / `rgb(...)` のハードコード |
| グローバル class | `_button` / `_panel` / `_selectable` 等を活用 | — |
| アイコン | Tabler icons クラス `<i class="ti ti-info-circle">` | インライン SVG / 別アイコンセット |

詳細・テンプレート集は → [knowledge/component-conventions.md](../knowledge/component-conventions.md) / [knowledge/scss-modules.md](../knowledge/scss-modules.md)。

## i18n の使い分け

引数なし → `i18n.ts.<key>` / 引数あり → `i18n.tsx.<key>(...)`。詳細は → [knowledge/i18n-usage.md](../knowledge/i18n-usage.md)。

新キー追加が必要なら → [tasks/adding-i18n-key.md](adding-i18n-key.md)。

## `os.*` ヘルパー

`os.alert` / `os.confirm` / `os.popup` / `os.toast` / `os.popupMenu` 等。詳細は → [knowledge/os-api.md](../knowledge/os-api.md)。

## アクセシビリティ最低ライン

1. **クリック可能要素は `<button class="_button">` を第一選択**。やむを得ず `<div @click>` なら `role="button"` + `tabindex="0"` + `@keydown.enter` / `@keydown.space.prevent` の 4 点セット必須
2. **フォーム要素 (`<input>` / `<select>` / `<textarea>`) は `<label>` 接続もしくは `aria-label`**
3. **`:disabled` バインドと `aria-disabled` を一致**させる。ハンドラ側でも早期 return
4. **キーボードのみで完結**できるか確認 (Tab で focus 移動できる / Enter で確定できる)
5. ARIA 属性は最小限

詳細チェックリストと既存例 (`MkButton.vue` / `MkSwitch.vue`) は → [knowledge/component-conventions.md §a11y](../knowledge/component-conventions.md)。

## Storybook 併設

共有 `Mk*` コンポーネントには `Mk<Name>.stories.impl.ts` を **同階層** に併設する (サブディレクトリ含む)。詳細は → [knowledge/storybook.md](../knowledge/storybook.md)。

## 検証フロー

```bash
# 型チェック (vue-tsc)
pnpm --filter frontend typecheck

# ESLint (規約全体)
pnpm --filter frontend eslint

# 単一ファイルに ESLint --fix
pnpm exec eslint --fix packages/frontend/src/components/Mk<Name>.vue

# Storybook で目視確認
pnpm --filter frontend storybook-dev    # localhost:6006

# Vitest unit test (component spec があれば)
pnpm --filter frontend test
```

## CHANGELOG エントリ

ユーザーから見える変更 (新規コンポーネントが新しい UI として露出する、既存 UI の挙動を変える) なら、`CHANGELOG.md` に追記する。判定方法と書式は [shipping-misskey-change スキル](../../../shipping-misskey-change/SKILL.md) で確認。

## 既存コンポーネントとの整合性

- 似た用途の既存 `Mk*` を 1-2 個読んで、props 命名 (`primary` / `danger` / `small` 等の形容詞、`onClose` ではなく `emit('close')` 等) を揃える
- グローバル utility class (`_button` / `_panel` / `_selectable` / `_gaps_m`) を使えば独自スタイルを書かずに済む → [knowledge/scss-modules.md](../knowledge/scss-modules.md)
- 大きな機能なら Storybook で各バリエーション (variant / size / disabled / loading) を網羅する

## 参照コード

- [MkInfo.vue](../../../../../packages/frontend/src/components/MkInfo.vue) — simple SFC 例
- [MkButton.vue](../../../../../packages/frontend/src/components/MkButton.vue) — 汎用ボタン (a11y / `_button` global class)
- [MkInput.vue](../../../../../packages/frontend/src/components/MkInput.vue) — generic + 2 ブロック script 例
- [MkSelect.vue](../../../../../packages/frontend/src/components/MkSelect.vue) — `defineModel` + 名前付き slot 例
- [MkSwitch.vue](../../../../../packages/frontend/src/components/MkSwitch.vue) — a11y 込みカスタム UI
- [MkButton.stories.impl.ts](../../../../../packages/frontend/src/components/MkButton.stories.impl.ts) — 複数 story Storybook 雛形
- [packages/frontend/src/os.ts](../../../../../packages/frontend/src/os.ts) — UI 操作 API 一覧
- [packages/frontend/src/i18n.ts](../../../../../packages/frontend/src/i18n.ts) — `i18n.ts` / `i18n.tsx` 実装
