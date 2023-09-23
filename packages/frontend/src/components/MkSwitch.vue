<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.disabled]: disabled && gaming === '', [$style.checked]: checked && gaming === '' }]">
	<input
		ref="input"
		type="checkbox"
		:disabled="disabled"
		:class="$style.input"
		@keydown.enter="toggle"
	>
	<XButton :checked="checked" :disabled="disabled" @toggle="toggle"/>
	<span :class="$style.body,{[$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light'}">
		<!-- TODO: 無名slotの方は廃止 -->
		<span :class="$style.label">
			<span @click="toggle">
				<slot name="label"></slot><slot></slot>
			</span>
			<span v-if="helpText" v-tooltip:dialog="helpText" class="_button _help" :class="$style.help"><i class="ti ti-help-circle"></i></span>
		</span>
		<p :class="$style.caption"><slot name="caption"></slot></p>
	</span>
</div>
</template>

<script lang="ts" setup>
import {toRefs, Ref, ref, computed, watch} from 'vue';
import XButton from '@/components/MkSwitch.button.vue';
import {defaultStore} from "@/store.js";
let gaming = ref('');
const gamingMode = computed(defaultStore.makeGetterSetter('gamingMode'));
const darkMode = computed(defaultStore.makeGetterSetter('darkMode'));

// gaming.valueに新しい値を代入する
if (darkMode.value && gamingMode.value == true) {
  gaming.value = 'dark';
} else if (!darkMode.value && gamingMode.value == true) {
  gaming.value = 'light';
} else {
  gaming.value = '';
}

watch(darkMode, () => {
  console.log(gaming)
  if (darkMode.value && gamingMode.value == true) {
    gaming.value = 'dark';
  } else if (!darkMode.value && gamingMode.value == true) {
    gaming.value = 'light';
  } else {
    gaming.value = '';
  }
})

watch(gamingMode, () => {
  if (darkMode.value && gamingMode.value == true) {
    gaming.value = 'dark';
  } else if (!darkMode.value && gamingMode.value == true) {
    gaming.value = 'light';
  } else {
    gaming.value = '';
  }
})

const props = defineProps<{
	modelValue: boolean | Ref<boolean>;
	disabled?: boolean;
	helpText?: string;
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', v: boolean): void;
}>();

const checked = toRefs(props).modelValue;
const toggle = () => {
	if (props.disabled) return;
	emit('update:modelValue', !checked.value);
};
</script>

<style lang="scss" module>
.root {
	position: relative;
	display: flex;
	transition: all 0.2s ease;
	user-select: none;

	&:hover {
		> .button {
			border-color: var(--inputBorderHover) !important;
		}
	}

	&.disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

  &.gamingDarkDisabled{
    opacity: 0.6;
    cursor: not-allowed;
    background: linear-gradient(270deg, #a84f4f, #a88c4f, #9aa24b, #6da85c, #53a8a6, #7597b5, #8679b5, #b579b5, #b56d96);
    background-size: 1800% 1800% !important;
    -webkit-animation: AnimationDark 45s cubic-bezier(0, 0.25, 0.25, 1) infinite !important;
    -moz-animation: AnimationDark 45s cubic-bezier(0, 0.25, 0.25, 1) infinite !important;
    animation: AnimationDark 45s cubic-bezier(0, 0.25, 0.25, 1) infinite !important;

  }
  &.gamingLightDisabled{
    opacity: 0.6;
    cursor: not-allowed;
    background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);
    background-size: 1800% 1800%;
    -webkit-animation: AnimationDark 44s cubic-bezier(0, 0.25, 0.25, 1) infinite;
    -moz-animation: AnimationDark 44s cubic-bezier(0, 0.25, 0.25, 1) infinite;
    animation: AnimationDark 44s cubic-bezier(0, 0.25, 0.25, 1) infinite;

  }
	//&.checked {
	//}
}

.input {
	position: absolute;
	width: 0;
	height: 0;
	opacity: 0;
	margin: 0;
}
.body {
	margin-left: 12px;
	margin-top: 2px;
	display: block;
	transition: inherit;
	color: var(--fg);
  &.gamingDark {
    background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);
    background-size: 1800% 1800%;
    -webkit-animation: AnimationDark 44s cubic-bezier(0, 0.25, 0.25, 1) infinite;
    -moz-animation: AnimationDark 44s cubic-bezier(0, 0.25, 0.25, 1) infinite;
    animation: AnimationDark 44s cubic-bezier(0, 0.25, 0.25, 1) infinite;

  }
  &.gamingLight{
    background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);
    background-size: 1800% 1800% !important;
    -webkit-animation: AnimationLight 45s cubic-bezier(0, 0.25, 0.25, 1) infinite !important;
    -moz-animation: AnimationLight 45s cubic-bezier(0, 0.25, 0.25, 1) infinite !important;
    animation: AnimationLight 45s cubic-bezier(0, 0.25, 0.25, 1) infinite !important;

  }
}

.label {
	display: block;
	line-height: 20px;
	cursor: pointer;
	transition: inherit;
}

.caption {
	margin: 8px 0 0 0;
	color: var(--fgTransparentWeak);
	font-size: 0.85em;

	&:empty {
		display: none;
	}
}

.help {
	margin-left: 0.5em;
	font-size: 85%;
	vertical-align: top;
}


</style>
