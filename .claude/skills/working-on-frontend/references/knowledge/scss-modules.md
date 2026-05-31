# SCSS Modules / CSS 変数 / utility class

Misskey の SCSS 規約。`<style lang="scss" module>` の書き方、`--MI_THEME-*` / `--MI-*` CSS 変数の使い分け、グローバル utility class の一覧をまとめる。

## CSS 変数の使い分け

Misskey のテーマシステムは 2 系統の CSS 変数で構成される。新規のスタイルは **必ず変数経由** にする。直接の `#fff` / `rgb()` / `rgba()` ハードコードは vue-component-reviewer から Major 指摘される。

### `--MI_THEME-*` (テーマ依存)

ユーザーが選んだテーマ (light / dark / 個別テーマ) で変わる色。`packages/frontend-shared/themes/_dark.json5` などで定義。

| 変数 | 用途 |
|---|---|
| `--MI_THEME-bg` | ページ背景 |
| `--MI_THEME-panel` | カード / パネル背景 |
| `--MI_THEME-panelHighlight` | 強調表示パネル |
| `--MI_THEME-fg` | 本文文字色 |
| `--MI_THEME-fgHighlighted` | 強調文字色 |
| `--MI_THEME-fgOnPanel` | パネル上の文字 |
| `--MI_THEME-fgOnAccent` | accent 色背景上の文字 (≒白系) |
| `--MI_THEME-accent` | プライマリアクセント (リンク、active state) |
| `--MI_THEME-accentedBg` | accent 系の薄背景 |
| `--MI_THEME-divider` | 罫線 |
| `--MI_THEME-error` | エラー色 |
| `--MI_THEME-warn` / `--MI_THEME-infoWarnBg` / `--MI_THEME-infoWarnFg` | 警告系 |
| `--MI_THEME-infoBg` / `--MI_THEME-infoFg` | 情報系 |
| `--MI_THEME-buttonBg` / `--MI_THEME-buttonHoverBg` | ボタン背景 |
| `--MI_THEME-inputBorder` / `--MI_THEME-inputBorderHover` | フォーム枠 |
| `--MI_THEME-focus` | フォーカスリング色 |
| `--MI_THEME-link` | リンク色 |
| `--MI_THEME-mention` / `--MI_THEME-hashtag` | メンション / ハッシュタグ |

全部の一覧が必要なら `packages/frontend-shared/themes/_light.json5` を読むのが早い (JSON5 で全キーが揃っている)。

### `--MI-*` (UI 共通定数、テーマ非依存)

| 変数 | 用途 |
|---|---|
| `--MI-radius` | 標準角丸 (`12px`) |
| `--MI-margin` | 標準余白 (大、`16px` / モバイルでは `10px`) |
| `--MI-marginHalf` | 標準余白の半分 |
| `--MI-modalBgFilter` | モーダル背景 (backdrop) のフィルタ |

`var(--MI-radius)` を使うとアプリ全体で角丸の大きさが揃う。`border-radius: 12px;` のように直書きすると、後から角丸を変える要件が来たときに全件直すことになる。

### ハードコードの例外

色は基本ハードコード禁止だが、以下のケースは正当化される:

- `transparent` / `currentColor` / `none` などの CSS キーワード
- alpha だけ動的に変えたい → `color-mix(in srgb, var(--MI_THEME-fg) 50%, transparent)` のように合成する
- アイコンサイズ等、CSS 変数化されていない数値定数 (`font-size: 14px;` 等は OK)

## グローバル utility class

`packages/frontend/src/style.scss` に定義されたグローバル class。`<style module>` 内のクラスと **併用** する (`:class="[$style.root, '_button']"` ではなく、HTML の `class="_button"` 属性で直接書く)。

下表は **よく使う代表例** で網羅ではない (class は随時増減するため、この一覧は腐りやすい)。手元の class が実在するか / 実装を確認したいときは正本の [packages/frontend/src/style.scss](../../../../../packages/frontend/src/style.scss) を直接見る (`grep -nE '^\._' packages/frontend/src/style.scss` で定義済み class を列挙できる)。

| class | 意味 |
|---|---|
| `_button` | クリック可能な無装飾ベース (`appearance:none` + `cursor:pointer` + disabled cursor のリセットのみ。focus ring や ripple は**含まない** — ripple が要るなら `MkButton.vue` を使う)。`<button>` または `<a>` に付ける |
| `_buttonPrimary` | `_button` + accent 色背景 (確定アクション) |
| `_buttonGradate` | `_button` + グラデーション背景 |
| `_panel` | カード / パネル枠 (背景 + 角丸 + `overflow:clip`。shadow は含まない) |
| `_selectable` | テキスト選択許可 (Misskey はデフォルトで本文以外の選択を抑止しているため) |
| `_selectableAtomic` | 子要素まとめて 1 単位で選択 |
| `_noSelect` | テキスト選択禁止 |
| `_nowrap` | `white-space: nowrap;` |
| `_help` | accent 色 + `cursor: help` (ヘルプアイコン用) |
| `_textButton` | accent 色のテキストボタン (hover で下線) |
| `_link` | テキストリンク強調 |
| `_gaps` | 縦並び flex (`display: flex; flex-direction: column; gap: var(--MI-margin);`) |
| `_gaps_m` / `_gaps_s` | 同じく縦並び flex で gap 固定 (`21px` / `10px`) |
| `_margin` | 標準 margin (= `--MI-margin`) |
| `_shadow` | 標準シャドウ (`box-shadow`) |
| `_popup` | popup / dropdown 用 (背景 + 角丸 + `contain`。shadow は含まない) |
| `_acrylic` | 半透明 + backdrop blur (アクリル風) |

使い方:

```vue
<template>
<button class="_button _buttonPrimary" :class="$style.action" @click="onClick">
	{{ i18n.ts.save }}
</button>
</template>

<style lang="scss" module>
.action {
	padding: 8px 24px;
	/* 背景色や focus ring は _buttonPrimary が持つので書かない */
}
</style>
```

## `<style lang="scss" module>` の特殊記法

### `:global(...)` で module スコープから出る

`<style lang="scss" module>` 内に書いたクラス名はビルド時にハッシュ化されて他コンポーネントから参照できなくなる。これを意図的に外したい (子コンポーネント側の特定クラスや外部ライブラリのクラスにスタイルを当てたい) 場合のみ `:global(...)` を使う:

```scss
.root {
	:global(.someThirdPartyClass) {
		color: var(--MI_THEME-fg);
	}
}
```

通常はほぼ使わない。

### `:deep(...)` で子コンポーネント内部を狙う

```scss
.root :deep(.child-internal-class) {
	color: var(--MI_THEME-accent);
}
```

これも頻用しない (子コンポーネントを直接修正する方が望ましい)。

## 命名

- module class は **camelCase** が慣習 (`root` / `inputCore` / `headerText`)
- BEM 風の `block__element--modifier` は使わない (CSS Modules でハッシュ化されるので名前衝突を心配する必要が無い)
- 状態 modifier は `&.active` / `&.disabled` のようにネストする

## ありがちなレビュー指摘

- `#fff` / `#000` / `rgba(0, 0, 0, 0.5)` のハードコード → `var(--MI_THEME-fg)` / `var(--MI_THEME-bg)` / `color-mix(...)` 等に置き換える
- `<style scoped>` で書いている (module ではない) → `<style lang="scss" module>` に直し、`:class="$style.foo"` で参照する
- 自前で `border-radius: 8px; padding: 14px;` を書いている → `_panel` global class 使えば不要
- 自前で button styling を書いている → `_button` global class を base に乗せる
