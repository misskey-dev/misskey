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

	<MkButton v-if="manualSave && changed" primary :class="$style.save" @click="update"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
</div>
</template>

<script lang="ts">
export interface MkDateTimeInputDateObject {
	year: number;
	month: number;
	date: number;
}

export interface MkDateTimeInputTimeObject {
	hour: number;
	minute: number;
}

export interface DateTimeObject extends MkDateTimeInputDateObject, MkDateTimeInputTimeObject {}

export type FormType = 'date' | 'time' | 'datetime';

export type MkDateTimeInputValue<F extends FormType> =
	F extends 'date'
		? MkDateTimeInputDateObject
	: F extends 'time'
		? MkDateTimeInputTimeObject
	: F extends 'datetime'
		? DateTimeObject
	: never;
</script>

<script lang="ts" setup generic="FORM extends FormType">
import { onMounted, nextTick, ref, computed, toRefs, useTemplateRef, watch, shallowRef, defineAsyncComponent } from 'vue';
import { i18n } from '@/i18n.js';
import { useInterval } from '@@/js/use-interval.js';
import { dateTimeFormat } from '@@/js/intl-const.js';
import { getHTMLElementOrNull } from '@/utility/get-dom-node-or-null.js';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';

const props = defineProps<{
	type: FORM;
	min?: MkDateTimeInputValue<FORM>;
	max?: MkDateTimeInputValue<FORM>;
	required?: boolean;
	readonly?: boolean;
	disabled?: boolean;
	placeholder?: string;
	autofocus?: boolean;
	inline?: boolean;
	small?: boolean;
	large?: boolean;
	manualSave?: boolean;
}>();

const model = defineModel<MkDateTimeInputValue<FORM> | null>({ required: true });
const value = ref(model.value);
const changed = computed(() => {
	if (model.value == null && value.value == null) {
		return false;
	} else if (model.value == null && value.value != null) {
		return true;
	} else if (model.value != null && value.value == null) {
		return true;
	} else {
		if (props.type === 'date') {
			const mv = model.value as MkDateTimeInputDateObject;
			const vv = value.value as MkDateTimeInputDateObject;
			return mv.year !== vv.year || mv.month !== vv.month || mv.date !== vv.date;
		} else if (props.type === 'time') {
			const mv = model.value as MkDateTimeInputTimeObject;
			const vv = value.value as MkDateTimeInputTimeObject;
			return mv.hour !== vv.hour || mv.minute !== vv.minute;
		} else if (props.type === 'datetime') {
			const mv = model.value as DateTimeObject;
			const vv = value.value as DateTimeObject;
			return mv.year !== vv.year || mv.month !== vv.month || mv.date !== vv.date || mv.hour !== vv.hour || mv.minute !== vv.minute;
		}
		return false;
	}
});

watch(model, () => {
	if (props.manualSave) {
		value.value = model.value;
	}
});

watch(value, () => {
	if (!props.manualSave) {
		model.value = value.value;
	}
});

function update() {
	model.value = value.value;
}

function assertDateObject<F extends FormType | FORM>(obj: unknown, type: F): obj is MkDateTimeInputValue<F> {
	return props.type === type;
}

const { autofocus } = toRefs(props);
const focused = ref(false);
const opening = ref(false);
const currentValueText = computed<string | null>(() => {
	if (value.value == null) {
		return null;
	}

	if (assertDateObject(value.value, 'date')) {
		return `${value.value.year.toString().padStart(4, '0')}/${value.value.month.toString().padStart(2, '0')}/${value.value.date.toString().padStart(2, '0')}`;
	} else if (assertDateObject(value.value, 'time')) {
		return `${value.value.hour.toString().padStart(2, '0')}:${value.value.minute.toString().padStart(2, '0')}`;
	} else if (assertDateObject(value.value, 'datetime')) {
		const v = value.value as DateTimeObject;
		const date = new Date(
			v.year,
			v.month - 1,
			v.date,
			v.hour,
			v.minute,
		);
		return dateTimeFormat.format(date);
	}

	return null;
});

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

function show() {
	if (opening.value || props.disabled || props.readonly) return;
	focus();

	opening.value = true;

	const { dispose } = os.popup(defineAsyncComponent(() => import('./MkDateTimeInput.dialog.vue')), {
		initialValue: value.value,
		type: props.type,
		min: props.min,
		max: props.max,
		width: container.value?.offsetWidth,
		anchorElement: container.value || null,
		returnFocusTo: getHTMLElementOrNull(container.value) ?? getHTMLElementOrNull(window.document.activeElement),
	}, {
		chosen: (newValue: MkDateTimeInputValue<FORM> | null) => {
			value.value = newValue;
		},
		closing: () => {
			opening.value = false;
		},
		closed: () => {
			dispose();
		},
	});
}

onMounted(() => {
	nextTick(() => {
		if (autofocus.value) {
			focus();
		}
	});
});
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
