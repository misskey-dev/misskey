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
import type { OptionValue } from '@/types/option-value.js';

export type ItemOption<T extends OptionValue = OptionValue> = {
	type?: 'option';
	value: T;
	label: string;
};

export type ItemGroup<T extends OptionValue = OptionValue> = {
	type: 'group';
	label?: string;
	items: ItemOption<T>[];
};

export type MkSelectItem<T extends OptionValue = OptionValue> = ItemOption<T> | ItemGroup<T>;

export type GetMkSelectValueType<T extends MkSelectItem> = T extends ItemGroup
	? T['items'][number]['value']
	: T extends ItemOption
		? T['value']
		: never;

export type GetMkSelectValueTypesFromDef<T extends MkSelectItem[]> = T[number] extends MkSelectItem
	? GetMkSelectValueType<T[number]>
	: never;
</script>

<script lang="ts" setup generic="const ITEMS extends MkSelectItem[], MODELT extends OptionValue">
import { onMounted, nextTick, ref, watch, computed, toRefs, useTemplateRef } from 'vue';
import { useInterval } from '@@/js/use-interval.js';
import type { MenuItem } from '@/types/menu.js';
import * as os from '@/os.js';

const props = defineProps<{
	items: ITEMS;
	required?: boolean;
	readonly?: boolean;
	disabled?: boolean;
	placeholder?: string;
	autofocus?: boolean;
	inline?: boolean;
	small?: boolean;
	large?: boolean;
}>();

type ModelTChecked = MODELT & (
	MODELT extends GetMkSelectValueTypesFromDef<ITEMS>
		? unknown
		: 'Error: The type of model does not match the type of items.'
);

const model = defineModel<ModelTChecked>({ required: true });

const { autofocus } = toRefs(props);
const focused = ref(false);
const opening = ref(false);
const currentValueText = ref<string | null>(null);
const inputEl = useTemplateRef('inputEl');
const prefixEl = useTemplateRef('prefixEl');
const suffixEl = useTemplateRef('suffixEl');
const container = useTemplateRef('container');
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

watch([model, () => props.items], () => {
	let found: ItemOption | null = null;
	for (const item of props.items) {
		if (item.type === 'group') {
			for (const option of item.items) {
				if (option.value === model.value) {
					found = option;
					break;
				}
			}
		} else {
			if (item.value === model.value) {
				found = item;
				break;
			}
		}
	}
	if (found) {
		currentValueText.value = found.label;
	}
}, { immediate: true, deep: true });

function show() {
	if (opening.value || props.disabled || props.readonly) return;
	focus();

	opening.value = true;

	const menu: MenuItem[] = [];

	for (const item of props.items) {
		if (item.type === 'group') {
			if (item.label != null) {
				menu.push({
					type: 'label',
					text: item.label,
				});
			}
			for (const option of item.items) {
				menu.push({
					text: option.label,
					active: computed(() => model.value === option.value),
					action: () => {
						model.value = option.value as ModelTChecked;
					},
				});
			}
		} else {
			menu.push({
				text: item.label,
				active: computed(() => model.value === item.value),
				action: () => {
					model.value = item.value as ModelTChecked;
				},
			});
		}
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
