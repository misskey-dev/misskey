# Storybook (`*.stories.impl.ts`) 規約

共有 `Mk*` コンポーネントには `Mk<Name>.stories.impl.ts` を **同階層** に併設するのが慣習。

## 配置と命名

- **ファイル名は `.stories.impl.ts` 固定** (`.stories.ts` は `packages/frontend/.storybook/generate.tsx` による生成物で手編集・コミット不可)
- 同階層に置く (`components/MkButton.stories.impl.ts`、`components/global/MkAvatar.stories.impl.ts` 等)
- 先頭に TS コメント形式の SPDX ヘッダーが必要

## 基本: 単一 story (Default のみ)

シンプルなコンポーネントならこれで十分。(以下の `MkColoredTag` は説明用の**架空のコンポーネント名**。実在しない。実物のパターンは `MkButton.stories.impl.ts` を参照。)

```ts
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import type { StoryObj } from '@storybook/vue3';
import MkColoredTag from './MkColoredTag.vue';

export const Default = {
	render(args) {
		return {
			components: { MkColoredTag },
			setup() {
				return { args };
			},
			template: '<MkColoredTag v-bind="args">タグ</MkColoredTag>',
		};
	},
	args: {
		variant: 'info',
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkColoredTag>;
```

ポイント:

- 上 2 つの `eslint-disable` は Storybook のお作法で必須 (render の関数が return type を明示しないため / `default export` ではないため)
- `satisfies StoryObj<typeof MkColoredTag>` が無いと `args` の型補完が効かなくなる

## 複数 story (variant 別)

参考: [MkButton.stories.impl.ts](../../../../../packages/frontend/src/components/MkButton.stories.impl.ts)

variant / size / 状態などのバリエーションがあるなら、`Default` を base にして spread で派生させると簡潔。

```ts
export const Default = {
	render(args) {
		return {
			components: { MkColoredTag },
			setup() {
				return { args };
			},
			template: '<MkColoredTag v-bind="args">タグ</MkColoredTag>',
		};
	},
	args: {
		variant: 'info',
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkColoredTag>;

export const Warn = {
	...Default,
	args: { ...Default.args, variant: 'warn' },
} satisfies StoryObj<typeof MkColoredTag>;

export const Danger = {
	...Default,
	args: { ...Default.args, variant: 'danger' },
} satisfies StoryObj<typeof MkColoredTag>;

export const Disabled = {
	...Default,
	args: { ...Default.args, disabled: true },
} satisfies StoryObj<typeof MkColoredTag>;
```

## イベントを可視化する (`action()`)

クリック等の emit を Storybook の Actions panel で見たい場合、`storybook/actions` の `action()` を使う。

```ts
import { action } from 'storybook/actions';
// ...
export const Default = {
	render(args) {
		return {
			components: { MkColoredTag },
			setup() {
				return { args };
			},
			computed: {
				props() {
					return { ...this.args };
				},
				events() {
					return {
						click: action('click'),
						close: action('close'),
					};
				},
			},
			template: '<MkColoredTag v-bind="props" v-on="events">タグ</MkColoredTag>',
		};
	},
	args: {},
	parameters: { layout: 'centered' },
} satisfies StoryObj<typeof MkColoredTag>;
```

`MkButton.stories.impl.ts` がこのパターン。

## `argTypes` で controls を細かく制御

string union を radio に / number を range に変えるとレビューが楽になる。(標準の Storybook 機能。現状リポジトリ内の `.stories.impl.ts` では実際には使われていないので必須ではない。)

```ts
export const Default = {
	render(args) { /* ... */ },
	args: { variant: 'info' },
	argTypes: {
		variant: {
			control: 'inline-radio',
			options: ['info', 'warn', 'danger'],
		},
		disabled: {
			control: 'boolean',
		},
	},
	parameters: { layout: 'centered' },
} satisfies StoryObj<typeof MkColoredTag>;
```

## `parameters.layout` の使い分け

| 値 | 使い所 |
|---|---|
| `'centered'` | 単体表示 (ボタン、タグ、アイコン等の小さい部品) |
| `'fullscreen'` | ページ単位、もしくはパネル全体を見せたい時 |
| `'padded'` (デフォルト) | 周囲に余白が欲しい中サイズ部品 |

`layout` を変えるだけで Storybook 上の見え方が大きく変わる。レイアウト依存のコンポーネント (sticky header 等) なら `'fullscreen'` を選ぶ。

## slot の中身を可変にする

`args` に slot 用文字列フィールドを足し、template で `{{ args.label }}` のように展開する。

```ts
export const Default = {
	render(args) {
		return {
			components: { MkColoredTag },
			setup() {
				return { args };
			},
			template: '<MkColoredTag v-bind="args">{{ args.label }}</MkColoredTag>',
		};
	},
	args: {
		label: 'タグ',
		variant: 'info',
	},
	parameters: { layout: 'centered' },
} satisfies StoryObj<typeof MkColoredTag>;
```

ただし `label` を component の props にしてしまうのは禁物 (slot で受け取る方針なら slot のままにする)。Storybook 上だけで使う表示用文字列として扱う。

## 確認方法

```bash
pnpm --filter frontend storybook-dev    # http://localhost:6006
pnpm --filter frontend build-storybook  # 静的ビルド
```

新規コンポーネントの stories が Sidebar に出ない場合、多くは [generate.tsx](../../../../../packages/frontend/.storybook/generate.tsx) の生成対象 **allowlist** に入っていないため。`src/{components,pages,...}/**/*.vue` の全体 glob はコメントアウトされており、対象は `globSync('src/components/global/Mk*.vue')` / `globSync('src/components/Mk[B-E]*.vue')` などの**明示列挙**になっている。`.stories.impl.ts` を併設しただけでは自動では出ないことがあるので、対象外なら generate.tsx に 1 行追加する。加えて、ファイル名 (`.stories.impl.ts`) と SPDX ヘッダー以降に構文エラーが無いかも確認する。

Chromatic (`pnpm --filter frontend chromatic`) で視覚回帰チェックも行われる。
