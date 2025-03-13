<template>
<div>
	<div :class="$style.label" @click="focus"><slot name="label"></slot></div>
	<div :class="[$style.input, { [$style.inline]: inline, [$style.disabled]: disabled, [$style.focused]: focused }]">
		<div ref="prefixEl" :class="$style.prefix"><slot name="prefix"></slot></div>
		<div ref="scrollerEl" :class="$style.inputCoreScroller">
			<div :class="$style.inputCoreWrapper">
				<div :class="$style.inputHighlight">
					<template
						v-for="token in parsedRawV"
						:key="token.value"
					>
						<span
							:class="[$style.hl, {
								[$style.hl_orText]: token.type === 'orText',
								[$style.hl_orOperator]: token.type === 'orOperator',
								[$style.hl_notText]: token.type === 'notText',
								[$style.hl_notOperator]: token.type === 'notOperator',
								[$style.hl_exactMatch]: token.type === 'exactMatch',
							}]"
						>{{ token.value }}</span>
					</template>
				</div>
				<input
					ref="inputEl"
					v-model="v"
					:class="$style.inputCore"
					:type="type"
					:disabled="disabled"
					:required="required"
					:readonly="readonly"
					:placeholder="placeholder"
					:pattern="pattern"
					:autocomplete="autocomplete"
					:autocapitalize="autocapitalize"
					:spellcheck="spellcheck"
					:inputmode="inputmode"
					:step="step"
					:min="min"
					:max="max"
					@focus="focused = true"
					@blur="focused = false"
					@keydown="onKeydown($event)"
					@input="onInput"
				>
			</div>
		</div>
		<div ref="suffixEl" :class="[$style.suffix, { [$style.enableControls]: $slots.suffix == null }]">
			<slot name="suffix">
				<button class="_button" :class="$style.clearButton" :disabled="disabled" @click.stop="clear">
					<i class="ti ti-x"></i>
				</button>
				<button
					v-if="$i != null && $i.policies.canSearchWithHanamiSearchV1 === true"
					class="_button"
					:class="[
						$style.modeSwitchButton,
						{ [$style.v1]: searchMode === 'v1' },
					]"
					:disabled="disabled"
					@click.stop="setSearchMode"
				>
					<div><i class="ti ti-sparkles"></i></div>
					<div :class="$style.modeSwitchValue">{{ searchMode }}</div>
					<div><i class="ti ti-chevron-down"></i></div>
				</button>
			</slot>
		</div>
	</div>
	<div :class="$style.caption"><slot name="caption"></slot></div>
</div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, useTemplateRef, ref, computed, watch } from 'vue';
import * as os from '@/os.js';
import { $i } from '@/i.js';
import { useInterval } from '@@/js/use-interval.js';
import type { InputHTMLAttributes } from 'vue';
import type { SuggestionType } from '@/utility/autocomplete.js';
import type { SearchMode } from '@/hana/types/search.js';

const props = defineProps<{
	modelValue: string | number | null;
	type?: InputHTMLAttributes['type'];
	required?: boolean;
	readonly?: boolean;
	disabled?: boolean;
	pattern?: string;
	placeholder?: string;
	autofocus?: boolean;
	autocomplete?: string;
	mfmAutocomplete?: boolean | SuggestionType[],
	autocapitalize?: string;
	spellcheck?: boolean;
	inputmode?: InputHTMLAttributes['inputmode'];
	step?: InputHTMLAttributes['step'];
	min?: number;
	max?: number;
	inline?: boolean;
	debounce?: boolean;
	small?: boolean;
	large?: boolean;
}>();

const v = defineModel<string>({ required: true });
const searchMode = defineModel<SearchMode>('mode');

type Token = {
	value: string;
	type: 'orText' | 'orOperator' | 'notText' | 'notOperator' | 'exactMatch' | 'text';
};
const rawV = ref<string>(v.value);
const parsedRawV = computed<Token[]>(() => {
	if (searchMode.value === 'v0') {
		return [{ value: rawV.value, type: 'text' }];
	} else {
		const _rawV = rawV.value.split(/(\s)/);
		const tokens: Token[] = [];

		let nextToken: 'or' | 'not' | null = null;
		let inExactMatch = false;
		for (let i = 0; i < _rawV.length; i++) {
			const token = _rawV[i];
			if (inExactMatch) {
				tokens[tokens.length - 1].value += token;
				if (token.endsWith('\'')) {
					inExactMatch = false;
				}
			} else if (/^\s$/.test(token)) {
				tokens.push({ value: token, type: 'text' });
			} else if (token === 'OR') {
				tokens.push({ value: 'OR', type: 'orOperator' });
				tokens[i - 2].type = 'orText';
				nextToken = 'or';
			} else if (token.startsWith('-')) {
				tokens.push({ value: '-', type: 'notOperator' });
				tokens.push({ value: token.slice(1), type: 'notText' });
			} else if (token.startsWith('\'') && token !== '\'') {
				tokens.push({ value: token, type: 'exactMatch' });
				if (!token.endsWith('\'')) {
					inExactMatch = true;
				}
			} else if (nextToken === 'or') {
				tokens.push({ value: token, type: 'orText' });
				nextToken = null;
			} else if (nextToken === 'not') {
				tokens.push({ value: token, type: 'notText' });
				nextToken = null;
			} else {
				tokens.push({ value: token, type: 'text' });
			}
		}

		if (inExactMatch) {
			// タグが適切に閉じられず終わっているのでテキスト扱いにする
			tokens[tokens.length - 1].type = 'text';
		}

		return tokens;
	}
});

const focused = ref(false);
const inputEl = useTemplateRef('inputEl');
const scrollerEl = useTemplateRef('scrollerEl');
const prefixEl = useTemplateRef('prefixEl');
const suffixEl = useTemplateRef('suffixEl');

const inputCorePaddingLeft = ref('0px');
const inputCorePaddingRight = ref('0px');

const emit = defineEmits<{
	(ev: 'change', _ev: KeyboardEvent): void;
	(ev: 'keydown', _ev: KeyboardEvent): void;
	(ev: 'enter', _ev: KeyboardEvent): void;
}>();

watch(v, (newValue) => {
	rawV.value = newValue;
});

const focus = () => inputEl.value?.focus();
const onInput = (event: Event) => {
	const ev = event as KeyboardEvent;
	rawV.value = (ev.target as HTMLInputElement).value;

	// カーソルが最後尾にある場合、scrollerEl をスクロールさせる
	if (inputEl.value?.selectionStart === rawV.value.length) {
		scrollerEl.value?.scrollBy(scrollerEl.value.scrollWidth, 0);
	}

	emit('change', ev);
};
const onKeydown = (ev: KeyboardEvent) => {
	if (ev.isComposing || ev.key === 'Process' || ev.keyCode === 229) return;

	if (ev.code === 'Home') {
		scrollerEl.value?.scrollTo(0, 0);
	} else if (ev.code === 'End') {
		scrollerEl.value?.scrollTo(scrollerEl.value.scrollWidth, 0);
	}

	emit('keydown', ev);

	if (ev.code === 'Enter') {
		emit('enter', ev);
	}
};
const height =
	props.small ? 33 :
	props.large ? 39 :
			36;

// このコンポーネントが作成された時、非表示状態である場合がある
// 非表示状態だと要素の幅などは0になってしまうので、定期的に計算する
useInterval(() => {
	if (inputEl.value == null) return;

	if (prefixEl.value) {
		if (prefixEl.value.offsetWidth) {
			inputCorePaddingLeft.value = prefixEl.value.offsetWidth + 'px';
		}
	}
	if (suffixEl.value) {
		if (suffixEl.value.offsetWidth) {
			inputCorePaddingRight.value = suffixEl.value.offsetWidth + 'px';
		}
	}
}, 100, {
	immediate: true,
	afterMounted: true,
});

function clear() {
	v.value = '';
}

function setSearchMode(ev: MouseEvent) {
	if (searchMode.value == null) return;

	const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/HanaSearchModePicker.vue')), {
		currentMode: searchMode.value,
		src: ev.currentTarget as HTMLElement,
	}, {
		changeMode: (mode: SearchMode) => {
			searchMode.value = mode;
		},
		closed: () => {
			dispose();
		},
	});
}
</script>

<style module lang="scss">
.label {
	font-size: 0.85em;
	padding: 0 0 8px 0;
	user-select: none;

	&:empty {
		display: none;
	}
}

.caption {
	font-size: 0.85em;
	padding: 8px 0 0 0;
	color: var(--MI_THEME-fgTransparentWeak);

	&:empty {
		display: none;
	}
}

.input {
	position: relative;
	height: v-bind("height + 'px'");
	background: var(--MI_THEME-panel);
	border: solid 1px var(--MI_THEME-panel);
	box-sizing: border-box;
	transition: border-color 0.1s ease-out;
	border-radius: 6px;

	&:hover {
		border-color: var(--MI_THEME-inputBorderHover) !important;
	}

	&.inline {
		display: inline-block;
		margin: 0;
	}

	&.focused {
		border-color: var(--MI_THEME-accent) !important;
	}

	&.disabled {
		opacity: 0.7;

		&,
		> .inputCore {
			cursor: not-allowed !important;
		}
	}
}

.inputCoreScroller {
	position: relative;
	overflow-x: auto;
	overflow-y: hidden;
	scrollbar-width: none;
	height: v-bind("height + 'px'");
	&::-webkit-scrollbar {
		display: none;
	}
}

.inputCoreWrapper {
	position: relative;
	width: max-content;
	min-width: 100%;
}

.inputCore {
	appearance: none;
	-webkit-appearance: none;
	border: none;
	display: block;
	position: absolute;
	top: 0;
	left: 0;
	height: v-bind("height + 'px'");
	width: 100%;
	margin: 0;
	font: inherit;
	font-weight: normal;
	font-size: 1em;
	color: transparent;
	background: transparent;
	caret-color: var(--MI_THEME-fg);
	border-radius: 6px;
	outline: none;
	box-shadow: none;
	box-sizing: border-box;

	padding-top: 0;
	padding-bottom: 0;
	padding-left: max(v-bind("inputCorePaddingLeft"), 12px);
	padding-right: max(v-bind("inputCorePaddingRight"), 12px);
}

.inputHighlight {
	font-size: 1em;
	line-height: v-bind("height + 'px'");
	color: var(--MI_THEME-fg);
	pointer-events: none;
	user-select: none;
	-webkit-user-drag: none;
	box-sizing: border-box;
	white-space: nowrap;
	word-break: break-all;
	width: max-content;

	padding-left: max(v-bind("inputCorePaddingLeft"), 12px);
	padding-right: max(v-bind("inputCorePaddingRight"), 12px);
}

.hl {
	white-space: pre;
}

html[data-color-scheme=light] .hl {
	--orFg: #2a2aff;
	--orBg: rgba(42, 159, 255, 0.2);
	--notFg: #eb5050;
	--notBg: rgba(255, 138, 42, 0.2);
	--exactMatchFg: #299938;
	--exactMatchBg: rgba(42, 159, 42, 0.2);
}

html[data-color-scheme=dark] .hl {
	/* lighter color for fg */
	--orFg: #b2b2ff;
	--orBg: rgba(120, 138, 216, 0.2);
	--notFg: #ff8a8a;
	--notBg: rgba(255, 138, 138, 0.2);
	--exactMatchFg: #6f6;
	--exactMatchBg: rgba(120, 138, 120, 0.2);
}

.hl_orText,
.hl_notText,
.hl_exactMatch {
	border-radius: 4px;
}

.hl_orText {
	color: var(--orFg);
	background-color: var(--orBg);
}

.hl_orOperator {
	color: var(--orFg);
}

.hl_notText {
	color: var(--notFg);
	background-color: var(--notBg);
}

.hl_notOperator {
	color: var(--notFg);
}

.hl_exactMatch {
	color: var(--exactMatchFg);
	background-color: var(--exactMatchBg);
}

.modeSwitchButton {
	position: relative;
	display: flex;
	align-items: center;
	height: 100%;
	padding: 0 4px;
	font-size: .9em;

	&:hover {
		opacity: 0.8;
	}

	&.v1 {
		color: var(--MI_THEME-fgOnAccent);
		font-weight: 700;

		&::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 100%;
			height: 2em;
			background: linear-gradient(90deg, var(--MI_THEME-buttonGradateA) 0%, var(--MI_THEME-buttonGradateB) 100%);
			border-radius: 999px;
			z-index: -1;
		}
	}
}

.modeSwitchValue {
	margin-left: -4px;
	min-width: 24px;
}

.clearButton {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	line-height: 24px;
	font-size: .9em;
	background-color: var(--MI_THEME-buttonBg);
	border-radius: 50%;

	& > i {
		display: block;
	}

	&:hover {
		background-color: var(--MI_THEME-buttonHoverBg);
	}
}

.prefix,
.suffix {
	display: flex;
	align-items: center;
	position: absolute;
	z-index: 1;
	top: 0;
	padding: 0 12px;
	font-size: 1em;
	height: v-bind("height - 2 + 'px'");
	min-width: 16px;
	max-width: 150px;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	box-sizing: border-box;
	pointer-events: none;
	background: var(--MI_THEME-panel);

	&:empty {
		display: none;
	}
}

.prefix {
	left: 0;
	padding-right: 6px;
	border-radius: 6px 0 0 6px;
}

.suffix {
	right: 0;
	padding-left: 6px;
	border-radius: 0 6px 6px 0;
}

.enableControls {
	gap: 4px;
	pointer-events: all;
}
</style>
