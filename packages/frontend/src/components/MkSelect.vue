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
		<select
			ref="inputEl"
			v-model="v"
			v-adaptive-border
			tabindex="-1"
			:class="$style.inputCore"
			:disabled="disabled"
			:required="required"
			:readonly="readonly"
			:placeholder="placeholder"
			@input="onInput"
			@mousedown.prevent="() => {}"
			@keydown.prevent="() => {}"
		>
			<slot></slot>
		</select>
		<div ref="suffixEl" :class="$style.suffix"><i class="ti ti-chevron-down" :class="[$style.chevron, { [$style.chevronOpening]: opening }]"></i></div>
	</div>
	<div :class="$style.caption"><slot name="caption"></slot></div>

	<MkButton v-if="manualSave && changed" primary :class="$style.save" @click="updated"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
</div>
</template>

<script lang="ts" setup>
import { onMounted, nextTick, ref, watch, computed, toRefs, VNode, useSlots, VNodeChild } from 'vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { useInterval } from '@@/js/use-interval.js';
import { i18n } from '@/i18n.js';
import type { MenuItem } from '@/types/menu.js';

const props = defineProps<{
	modelValue: string | null;
	required?: boolean;
	readonly?: boolean;
	disabled?: boolean;
	placeholder?: string;
	autofocus?: boolean;
	inline?: boolean;
	manualSave?: boolean;
	small?: boolean;
	large?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'changeByUser', value: string | null): void;
	(ev: 'update:modelValue', value: string | null): void;
}>();

const slots = useSlots();

const { modelValue, autofocus } = toRefs(props);
const v = ref(modelValue.value);
const focused = ref(false);
const opening = ref(false);
const changed = ref(false);
const invalid = ref(false);
const filled = computed(() => v.value !== '' && v.value != null);
const inputEl = ref<HTMLObjectElement | null>(null);
const prefixEl = ref<HTMLElement | null>(null);
const suffixEl = ref<HTMLElement | null>(null);
const container = ref<HTMLElement | null>(null);
const height =
	props.small ? 33 :
	props.large ? 39 :
	36;

const focus = () => container.value?.focus();
const onInput = (ev) => {
	changed.value = true;
};

const updated = () => {
	changed.value = false;
	emit('update:modelValue', v.value);
};

watch(modelValue, newValue => {
	v.value = newValue;
});

watch(v, () => {
	if (!props.manualSave) {
		updated();
	}

	invalid.value = inputEl.value?.validity.badInput ?? true;
});

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

function show() {
	if (opening.value) return;
	focus();

	opening.value = true;

	const menu: MenuItem[] = [];
	let options = slots.default!();

	const pushOption = (option: VNode) => {
		menu.push({
			text: option.children as string,
			active: computed(() => v.value === option.props?.value),
			action: () => {
				v.value = option.props?.value;
				changed.value = true;
				emit('changeByUser', v.value);
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
	color: var(--fgTransparentWeak);

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
			border-color: var(--accent) !important;
			//box-shadow: 0 0 0 4px var(--focus);
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
			border-color: var(--inputBorderHover) !important;
		}
	}
}

.inputCore {
	appearance: none;
	-webkit-appearance: none;
	display: block;
	height: v-bind("height + 'px'");
	width: 100%;
	margin: 0;
	padding: 0 12px;
	font: inherit;
	font-weight: normal;
	font-size: 1em;
	color: var(--fg);
	background: var(--panel);
	border: solid 1px var(--panel);
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
