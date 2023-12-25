<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<span
	v-tooltip="checked ? i18n.ts.itsOn : i18n.ts.itsOff"
	:class="{
		[$style.button]: true,
		[$style.buttonChecked]: checked,
		[$style.buttonDisabled]: props.disabled
	}"
	data-cy-switch-toggle
	@click.prevent.stop="toggle"
>
	<div :class="{ [$style.knob]: true, [$style.knobChecked]: checked }"></div>
</span>
</template>

<script lang="ts" setup>
import { toRefs, Ref } from 'vue';
import { i18n } from '@/i18n.js';

const props = withDefaults(defineProps<{
	checked: boolean | Ref<boolean>;
	disabled?: boolean;
}>(), {
	disabled: false,
});

const emit = defineEmits<{
	(ev: 'toggle'): void;
}>();

const checked = toRefs(props).checked;
const toggle = () => {
	emit('toggle');
};
</script>

<style lang="scss" module>
.button {
	position: relative;
	display: inline-flex;
	flex-shrink: 0;
	margin: 0;
	box-sizing: border-box;
	width: 32px;
	height: 23px;
	outline: none;
	background: var(--switchOffBg);
	background-clip: content-box;
	border: solid 1px var(--switchOffBg);
	border-radius: 999px;
	cursor: pointer;
	transition: inherit;
	user-select: none;
}

.buttonChecked {
	background-color: var(--switchOnBg) !important;
	border-color: var(--switchOnBg) !important;
}

.buttonDisabled {
	cursor: not-allowed;
}

.knob {
	position: absolute;
	top: 3px;
	width: 15px;
	height: 15px;
	border-radius: 999px;
	transition: all 0.2s ease;

	&:not(.knobChecked) {
		left: 3px;
		background: var(--switchOffFg);
	}
}

.knobChecked {
	left: 12px;
	background: var(--switchOnFg);
}
</style>
