# Vue SFC 規約・テンプレート集 + a11y チェックリスト

Misskey の Vue 3 SFC 規約と、新規 `Mk*` コンポーネント / 既存コンポーネント編集時のテンプレート / アクセシビリティ要件をまとめたページ。

## 目次

- [SFC スタイルの基本](#sfc-スタイルの基本)
- [`<script>` / `<style>` 規約](#script--style-規約)
- [テンプレート集](#テンプレート集)
  - [simple (`<slot>` + 単純 props)](#simple-slot--単純-props)
  - [generic + 2 ブロック script](#generic--2-ブロック-script)
  - [`defineModel` で v-model 連動](#definemodel-で-v-model-連動)
  - [emit + 名前付き slot で外部から動作を差し込む](#emit--名前付き-slot-で外部から動作を差し込む)
- [a11y チェックリスト](#a11y-チェックリスト)

## SFC スタイルの基本

Composition API + `<script setup lang="ts">` を基本とする (Options API は新規導入しない)。型宣言や module スコープのユーティリティを置きたい時は、setup ブロックと **併用** する形で追加の `<script lang="ts">` ブロックを置いて構わない (例: [MkInput.vue](../../../../../packages/frontend/src/components/MkInput.vue) は `SupportedTypes` 型を別ブロックで宣言してから setup を書いている)。SCSS は **CSS Modules** で書き、`<style lang="scss" module>` を使う。

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

## `<script>` / `<style>` 規約

| 項目 | 規約 | 新規不可 |
|---|---|---|
| `<script>` 開始タグ | `<script lang="ts" setup>` または `<script setup lang="ts">` (順序不問) | `<script>` (lang 無し) / Options API (`export default { data() {...} }`) |
| Props 定義 | `defineProps<{ ... }>()` (type-only) | runtime object 形式 `defineProps({ name: { type: String } })` |
| Emits 定義 | `defineEmits<{ (ev: 'click'): void }>()` (type-only) | runtime array 形式 `defineEmits(['click'])` |
| 型ジェネリック | `<script setup lang="ts" generic="T extends ...">` 属性で渡す。複雑な型宣言が必要なら **2 ブロック構成** ([generic パターン](#generic--2-ブロック-script)) | — |
| `<style>` 開始タグ | `<style lang="scss" module>`、参照は `:class="$style.foo"` | `<style scoped>` (module なし) は新規不可 (legacy 混在) |
| CSS 値 | `var(--MI_THEME-...)` (テーマ) / `var(--MI-...)` (UI 共通定数) を使う | `#fff` / `rgb(...)` / `rgba(...)` のハードコード ([scss-modules.md](scss-modules.md)) |
| グローバル class | `_button` / `_panel` / `_selectable` / `_buttonPrimary` 等の global utility class を活用 | — |
| アイコン | Tabler icons クラス `<i class="ti ti-info-circle">` | インライン SVG / 別アイコンセット |

## テンプレート集

### simple (`<slot>` + 単純 props)

参考: [MkInfo.vue](../../../../../packages/frontend/src/components/MkInfo.vue)

```vue
<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.warn]: variant === 'warn' }]" class="_selectable">
	<i v-if="variant === 'warn'" class="ti ti-alert-triangle" :class="$style.icon"></i>
	<i v-else class="ti ti-info-circle" :class="$style.icon"></i>
	<div><slot></slot></div>
</div>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{
	variant?: 'info' | 'warn';
}>(), {
	variant: 'info',
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 12px 14px;
	font-size: 90%;
	background: var(--MI_THEME-infoBg);
	color: var(--MI_THEME-infoFg);
	border-radius: var(--MI-radius);

	&.warn {
		background: var(--MI_THEME-infoWarnBg);
		color: var(--MI_THEME-infoWarnFg);
	}
}

.icon {
	margin-right: 4px;
}
</style>
```

ポイント:

- デフォルト値が必要なら `withDefaults(defineProps<{...}>(), { ... })` を使う (type-only のまま既定値を渡せる)
- `_selectable` は本文選択を許可する global utility class ([scss-modules.md](scss-modules.md) 参照)
- `<i class="ti ti-...">` は Tabler icons。`v-if` 切り替えで variant 別アイコンを出すのは多用パターン

### generic + 2 ブロック script

参考: [MkInput.vue](../../../../../packages/frontend/src/components/MkInput.vue)

型ジェネリックを取りつつ、その型計算や `type` エイリアス宣言を setup ブロックの中に書きたくない場合は、**型宣言用 `<script lang="ts">` と setup 用 `<script lang="ts" setup>` を 2 つ並べる** 構成にできる。

```vue
<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<button
		v-for="item in items"
		:key="String(item.value)"
		class="_button"
		:class="[$style.item, { [$style.active]: item.value === modelValue }]"
		@click="select(item.value)"
	>
		{{ item.label }}
	</button>
</div>
</template>

<script lang="ts">
// module scope: 型 / 定数 / 純関数のみ。setup の中から見える。
export type ChoiceItem<T> = {
	value: T;
	label: string;
};
</script>

<script lang="ts" setup generic="T extends string | number">
const props = defineProps<{
	modelValue: T;
	items: ChoiceItem<T>[];
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: T): void;
}>();

function select(value: T) {
	emit('update:modelValue', value);
}
</script>
```

ポイント:

- `generic="T extends string | number"` の制約を付けることで、`v-model` で渡された型が `string` / `number` 系に限定される
- 2 ブロック構成にする理由は **setup ブロック内では `export type` が書けない** から
- `MkSelect.vue` のような複雑な型エクスポートをするコンポーネントで多用される

### `defineModel` で v-model 連動

参考: [MkSelect.vue](../../../../../packages/frontend/src/components/MkSelect.vue), [MkRadios.vue](../../../../../packages/frontend/src/components/MkRadios.vue)

Vue 3.4+ なら `defineModel` を使うと `props.modelValue` + `emit('update:modelValue', v)` の 2 行が 1 行に圧縮できる。

```vue
<template>
<label :class="[$style.root, { [$style.disabled]: disabled }]">
	<input
		v-model="checked"
		type="checkbox"
		:class="$style.input"
		:disabled="disabled"
	>
	<span :class="$style.label"><slot></slot></span>
</label>
</template>

<script lang="ts" setup>
const checked = defineModel<boolean>({ required: true });

const props = defineProps<{
	disabled?: boolean;
}>();
</script>
```

ポイント:

- `defineModel<boolean>()` は **自動で `props.modelValue` と `emit('update:modelValue', v)` を生成** する。返り値は `Ref` なので `checked.value = ...` で書き換えると emit される
- `defineModel('foo')` のように引数を渡すと `v-model:foo` (`props.foo` + `emit('update:foo', v)`) の連動が作れる
- Misskey は Vue 3.5 系なので `defineModel` でよい

### emit + 名前付き slot で外部から動作を差し込む

参考: [MkButton.vue](../../../../../packages/frontend/src/components/MkButton.vue)

クリック時の処理を呼び出し元に委ねるパターン (確認 UI など)。

```vue
<template>
<div :class="$style.root" class="_panel">
	<div :class="$style.header">
		<slot name="header">{{ i18n.ts.confirm }}</slot>
	</div>
	<div :class="$style.body">
		<slot></slot>
	</div>
	<div :class="$style.footer">
		<button class="_button" :class="$style.cancel" @click="emit('cancel')">
			{{ i18n.ts.cancel }}
		</button>
		<button class="_button _buttonPrimary" :class="$style.ok" @click="emit('ok')">
			{{ i18n.ts.ok }}
		</button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n.js';

const emit = defineEmits<{
	(ev: 'ok'): void;
	(ev: 'cancel'): void;
}>();
</script>
```

ポイント:

- 名前付き slot (`<slot name="header">`) と無名 slot (`<slot></slot>`) は両方使ってよい
- `_panel` / `_button` / `_buttonPrimary` は global utility class なので、自前で同じスタイルを書かない
- `emit('ok')` 等の単純 emit は中継するだけにし、`os.confirm` などの実際の確認 UI 起動は呼び出し元の責務にする (テスト・差し替えしやすくするため)

## a11y チェックリスト

Misskey の PR レビューで頻繁に出る a11y 指摘をまとめた。新規 / 既存コンポーネントを編集する時は以下を満たす。

### クリック可能要素

#### 第一選択: `<button class="_button">`

```vue
<button class="_button" :class="$style.action" :disabled="disabled" @click="onClick">
	{{ i18n.ts.save }}
</button>
```

- `_button` global class を付けると Misskey 共通のフォーカスリング / ripple / disabled スタイルが付く
- `<button>` はデフォルトで `tabindex` / Enter / Space / `aria-disabled` の挙動を持つので、追加の ARIA を書かなくてよい
- form の中で意図せず submit させたくない場合は `type="button"` を明示する (省略時は `type="submit"` 扱い)

#### やむを得ず `<div @click>` を使う場合

装飾やレイアウト都合で `<button>` が使えないときは、**4 点セット** を必ず揃える。

```vue
<div
	role="button"
	tabindex="0"
	:aria-disabled="disabled"
	:class="$style.fakeButton"
	@click="onClick"
	@keydown.enter="onClick"
	@keydown.space.prevent="onClick"
>
	<slot></slot>
</div>
```

| 属性 / ハンドラ | なぜ必要か |
|---|---|
| `role="button"` | スクリーンリーダーにボタンとして読ませる |
| `tabindex="0"` | キーボードでフォーカス可能にする |
| `@keydown.enter` | Enter で発火 (本物の `<button>` の挙動を再現) |
| `@keydown.space.prevent` | Space で発火 + ページスクロール防止 |
| `:aria-disabled` | disabled スタイルだけでなく状態も伝える |

`@keydown.enter` を忘れて click だけ付けるのが最頻出ミス。

#### `<a>` をボタン代わりに使うのは原則禁止

URL に飛ばない `<a href="#" @click.prevent>` は a11y / SEO 両面で良くない。リンクなら `<MkA>` ([MkA.vue](../../../../../packages/frontend/src/components/global/MkA.vue))、アクションなら `<button>` を使う。

### フォーム要素

#### `<label>` 接続

```vue
<!-- ✅ for / id で結ぶ -->
<label :for="id">{{ i18n.ts.username }}</label>
<input :id="id" v-model="username" type="text">

<!-- ✅ ラップする (id 不要) -->
<label>
	{{ i18n.ts.username }}
	<input v-model="username" type="text">
</label>
```

label を slot で受け取る共通コンポーネント ([MkInput.vue](../../../../../packages/frontend/src/components/MkInput.vue), [MkSwitch.vue](../../../../../packages/frontend/src/components/MkSwitch.vue)) を使うとこの規約は自然に守れる。

#### `aria-label` で代替

slot や label を見せたくない (アイコンのみのボタンなど) 場合は `aria-label`:

```vue
<button class="_button" :aria-label="i18n.ts.close" @click="emit('close')">
	<i class="ti ti-x"></i>
</button>
```

`aria-label` の値も i18n 経由にする (英語直書きは禁止)。

### `:disabled` と `aria-disabled` の整合

- 本物の `<button :disabled>` ならブラウザが click を抑止するが、`<div role="button">` は止めてくれない。`aria-disabled` を付けるだけでなく、**ハンドラ側でも早期 return** する:

```ts
function onClick() {
	if (props.disabled) return; // ← これが無いと disabled でも発火する
	// ...
}
```

### キーボード操作

- Tab で全ての操作可能要素にたどり着けること (`tabindex="-1"` を不用意に付けない)
- モーダル / popup を開いたら focus trap を考える ([MkModal.vue](../../../../../packages/frontend/src/components/MkModal.vue) のような既存コンポーネントは内部で対応している)
- リスト中の項目は矢印キー操作も考慮する。`MkSelect.vue` の `@keydown.space.enter` パターンを参考にする

### 既存実装の参考

| パターン | 既存コンポーネント |
|---|---|
| 標準的なボタン | [MkButton.vue](../../../../../packages/frontend/src/components/MkButton.vue) |
| カスタム UI でも a11y を満たす | [MkSwitch.vue](../../../../../packages/frontend/src/components/MkSwitch.vue) |
| input + label slot | [MkInput.vue](../../../../../packages/frontend/src/components/MkInput.vue) |
| キーボード操作対応の選択 UI | [MkSelect.vue](../../../../../packages/frontend/src/components/MkSelect.vue) |

### ありがちな PR レビュー指摘

- `<div @click>` に role / tabindex / keydown が無い
- アイコンだけのボタンに `aria-label` が無い (Tabler icon 自体には意味情報が無い)
- `disabled` スタイルだけ付けて `aria-disabled` / ハンドラ抑止が無い
- フォーカスリング (`:focus-visible` / `outline`) を `outline: none` で消したまま放置
