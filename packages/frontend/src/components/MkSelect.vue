<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div :class="$style.label" @click="focus"><slot name="label"></slot></div>
	<div
		ref="container"
		tabindex="0"
		:class="[$style.input, { [$style.inline]: inline, [$style.disabled]: disabled, [$style.focused]: focused || opening }]"
		@focus="focused = true"
		@blur="focused = false"
		@mousedown.prevent="show"
		@keydown.space.enter="show"
	>
		<div ref="prefixEl" :class="$style.prefix"><slot name="prefix"></slot></div>
		<div
			ref="inputEl"
			v-adaptive-border
			tabindex="-1"
			:class="$style.inputCore"
			:disabled="disabled"
			:required="required"
			:readonly="readonly"
			:placeholder="placeholder"
			@mousedown.prevent="() => {}"
			@keydown.prevent="() => {}"
		>
			<div style="pointer-events: none;">{{ currentValueText ?? '' }}</div>
			<div style="display: none;">
				<slot></slot>
			</div>
		</div>
		<div ref="suffixEl" :class="$style.suffix"><i class="ti ti-chevron-down" :class="[$style.chevron, { [$style.chevronOpening]: opening }]"></i></div>
	</div>
	<div :class="$style.caption"><slot name="caption"></slot></div>
</div>
</template>

<script lang="ts">
type ItemOption = {
	type?: 'option';
	value: string | number | null;
	label: string;
};

type ItemGroup = {
	type: 'group';
	label: string;
	items: ItemOption[];
};

export type MkSelectItem = ItemOption | ItemGroup;

type ValuesOfItems<T> = T extends (infer U)[]
	? U extends { type: 'group'; items: infer V }
		? V extends (infer W)[]
			? W extends { value: infer X }
				? X
				: never
			: never
		: U extends { value: infer Y }
			? Y
			: never
	: never;
</script>

<script lang="ts" setup generic="T extends MkSelectItem[]">
import { onMounted, nextTick, ref, watch, computed, toRefs, useSlots } from 'vue';
import { useInterval } from '@@/js/use-interval.js';
import type { VNode, VNodeChild } from 'vue';
import type { MenuItem } from '@/types/menu.js';
import * as os from '@/os.js';

// TODO: itemsをslot内のoptionで指定する用法は廃止する(props.itemsを必須化する)
// see: https://github.com/misskey-dev/misskey/issues/15558
// あと型推論と相性が良くない

const props = defineProps<{
	modelValue: ValuesOfItems<T>;
	required?: boolean;
	readonly?: boolean;
	disabled?: boolean;
	placeholder?: string;
	autofocus?: boolean;
	inline?: boolean;
	small?: boolean;
	large?: boolean;
	items?: T;
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: ValuesOfItems<T>): void;
}>();

const slots = useSlots();

const { modelValue, autofocus } = toRefs(props);
const focused = ref(false);
const opening = ref(false);
const currentValueText = ref<string | null>(null);
const inputEl = ref<HTMLObjectElement | null>(null);
const prefixEl = ref<HTMLElement | null>(null);
const suffixEl = ref<HTMLElement | null>(null);
const container = ref<HTMLElement | null>(null);
const height =
	props.small ? 33 :
	props.large ? 39 :
	36;

const focus = () => container.value?.focus();

// このコンポーネントが作成された時、非表示状態である場合がある
// 非表示状態だと要素の幅などは0になってしまうので、定期的に計算する
useInterval(() => {
	if (inputEl.value == null) return;

	if (prefixEl.value) {
		if (prefixEl.value.offsetWidth) {
			inputEl.value.style.paddingLeft = prefixEl.value.offsetWidth + 'px';
		}
	}
	if (suffixEl.value) {
		if (suffixEl.value.offsetWidth) {
			inputEl.value.style.paddingRight = suffixEl.value.offsetWidth + 'px';
		}
	}
}, 100, {
	immediate: true,
	afterMounted: true,
});

onMounted(() => {
	nextTick(() => {
		if (autofocus.value) {
			focus();
		}
	});
});

watch([modelValue, () => props.items], () => {
	if (props.items) {
		let found: ItemOption | null = null;
		for (const item of props.items) {
			if (item.type === 'group') {
				for (const option of item.items) {
					if (option.value === modelValue.value) {
						found = option;
						break;
					}
				}
			} else {
				if (item.value === modelValue.value) {
					found = item;
					break;
				}
			}
		}
		if (found) {
			currentValueText.value = found.label;
		}
		return;
	}

	const scanOptions = (options: VNodeChild[]) => {
		for (const vnode of options) {
			if (typeof vnode !== 'object' || vnode === null || Array.isArray(vnode)) continue;
			if (vnode.type === 'optgroup') {
				const optgroup = vnode;
				if (Array.isArray(optgroup.children)) scanOptions(optgroup.children);
			} else if (Array.isArray(vnode.children)) { // 何故かフラグメントになってくることがある
				const fragment = vnode;
				if (Array.isArray(fragment.children)) scanOptions(fragment.children);
			} else if (vnode.props == null) { // v-if で条件が false のときにこうなる
				// nop?
			} else {
				const option = vnode;
				if (option.props?.value === modelValue.value) {
					currentValueText.value = option.children as string;
					break;
				}
			}
		}
	};

	scanOptions(slots.default!());
}, { immediate: true, deep: true });

function show() {
	if (opening.value || props.disabled || props.readonly) return;
	focus();

	opening.value = true;

	const menu: MenuItem[] = [];

	if (props.items) {
		for (const item of props.items) {
			if (item.type === 'group') {
				menu.push({
					type: 'label',
					text: item.label,
				});
				for (const option of item.items) {
					menu.push({
						text: option.label,
						active: computed(() => modelValue.value === option.value),
						action: () => {
							emit('update:modelValue', option.value);
						},
					});
				}
			} else {
				menu.push({
					text: item.label,
					active: computed(() => modelValue.value === item.value),
					action: () => {
						emit('update:modelValue', item.value);
					},
				});
			}
		}
	} else {
		let options = slots.default!();

		const pushOption = (option: VNode) => {
			menu.push({
				text: option.children as string,
				active: computed(() => modelValue.value === option.props?.value),
				action: () => {
					emit('update:modelValue', option.props?.value);
				},
			});
		};

		const scanOptions = (options: VNodeChild[]) => {
			for (const vnode of options) {
				if (typeof vnode !== 'object' || vnode === null || Array.isArray(vnode)) continue;
				if (vnode.type === 'optgroup') {
					const optgroup = vnode;
					menu.push({
						type: 'label',
						text: optgroup.props?.label,
					});
					if (Array.isArray(optgroup.children)) scanOptions(optgroup.children);
				} else if (Array.isArray(vnode.children)) { // 何故かフラグメントになってくることがある
					const fragment = vnode;
					if (Array.isArray(fragment.children)) scanOptions(fragment.children);
				} else if (vnode.props == null) { // v-if で条件が false のときにこうなる
					// nop?
				} else {
					const option = vnode;
					pushOption(option);
				}
			}
		};

		scanOptions(options);
	}

	os.popupMenu(menu, container.value, {
		width: container.value?.offsetWidth,
		onClosing: () => {
			opening.value = false;
		},
	});
}
</script>

<style lang="scss" module>
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
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.75);

	&:empty {
		display: none;
	}
}

.input {
	position: relative;
	cursor: pointer;

	&.inline {
		display: inline-block;
		margin: 0;
	}

	&.focused {
		> .inputCore {
			border-color: var(--MI_THEME-accent) !important;
			//box-shadow: 0 0 0 4px var(--MI_THEME-focus);
		}
	}

	&.disabled {
		opacity: 0.7;

		&,
		> .inputCore {
			cursor: not-allowed !important;
		}
	}

	&:focus {
		outline: none;
	}

	&:hover {
		> .inputCore {
			border-color: var(--MI_THEME-inputBorderHover) !important;
		}
	}
}

.inputCore {
	appearance: none;
	-webkit-appearance: none;
	display: flex;
	align-items: center;
	height: v-bind("height + 'px'");
	width: 100%;
	margin: 0;
	padding: 0 12px;
	font: inherit;
	font-weight: normal;
	font-size: 1em;
	color: var(--MI_THEME-fg);
	background: var(--MI_THEME-panel);
	border: solid 1px var(--MI_THEME-panel);
	border-radius: 6px;
	outline: none;
	box-shadow: none;
	box-sizing: border-box;
	transition: border-color 0.1s ease-out;
	cursor: pointer;
	pointer-events: none;
	user-select: none;
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
	height: v-bind("height + 'px'");
	min-width: 16px;
	max-width: 150px;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	box-sizing: border-box;
	pointer-events: none;

	&:empty {
		display: none;
	}
}

.prefix {
	left: 0;
	padding-right: 6px;
}

.suffix {
	right: 0;
	padding-left: 6px;
}

.save {
	margin: 8px 0 0 0;
}

.chevron {
	transition: transform 0.1s ease-out;
}

.chevronOpening {
	transform: rotateX(180deg);
}
</style>
