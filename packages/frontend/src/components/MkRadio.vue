<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	v-adaptive-border
  :class="[$style.root, { [$style.disabled]: disabled, [$style.checked]: checked ,[$style.gamingDark]: gamingType === 'dark',[$style.gamingLight]: gamingType === 'light' } ]"
	:aria-checked="checked"
	:aria-disabled="disabled"
	@click="toggle"
>
	<input
		type="radio"
		:disabled="disabled"
		:class="$style.input"
	>
	<span :class="[$style.button , {[$style.gamingDark]: gamingType === 'dark',[$style.gamingLight]: gamingType === 'light'}]">
		<span></span>
	</span>
	<span :class="$style.label"><slot></slot></span>
</div>
</template>

<script lang="ts" setup>
import { ref,computed,watch } from 'vue';
import {defaultStore} from "@/store.js";

let gamingType = computed(defaultStore.makeGetterSetter('gamingType'));

const props = defineProps<{
	modelValue: any;
	value: any;
	disabled?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: any): void;
}>();

let checked = $computed(() => props.modelValue === props.value);

function toggle(): void {
	if (props.disabled) return;
	emit('update:modelValue', props.value);
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	display: inline-block;
	text-align: left;
	cursor: pointer;
	padding: 7px 10px;
	min-width: 60px;
	background-color: var(--panel);
	background-clip: padding-box !important;
	border: solid 1px var(--panel);
	border-radius: 6px;
	font-size: 90%;
	transition: all 0.2s;
	user-select: none;

	&.disabled {
		opacity: 0.6;
		cursor: not-allowed !important;
	}

	&:hover {
		border-color: var(--inputBorderHover) !important;
	}

	&.checked {
		background-color: var(--accentedBg) !important;
		border-color: var(--accentedBg) !important;
		color: var(--accent);
		cursor: default !important;
    &.gamingDark{
      color:black !important;
      border-color: black !important;
      background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);
      background-size: 1800% 1800%;
      -webkit-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.25, 0.25, 1) infinite;
      -moz-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.25, 0.25, 1) infinite;
      animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.25, 0.25, 1) infinite;
    }
    &.gamingLight{
      color:white;
      border-color: white !important;
      background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);      background-size: 1800% 1800% !important;
      -webkit-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.25, 0.25, 1) infinite !important;
      -moz-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.25, 0.25, 1) infinite !important;
      animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.25, 0.25, 1) infinite !important;
    }
		> .button {
			border-color: var(--accent);
      &.gamingDark{
        border-color:black;
        color:black !important;
      }
      &.gamingLight{
        border-color: white;
        color:white;
      }
      &.gamingDark:after{
        background-color: black;
        transform: scale(1);
        opacity: 1;
      }
      &.gamingLight:after{
        background-color:white !important;
        transform: scale(1);
        opacity: 1;
      }
			&:after {
				background-color: var(--accent);
				transform: scale(1);
				opacity: 1;

			}
		}
	}
}

.input {
	position: absolute;
	width: 0;
	height: 0;
	opacity: 0;
	margin: 0;
}

.button {
	position: absolute;
	width: 14px;
	height: 14px;
	background: none;
	border: solid 2px var(--inputBorder);
	border-radius: 100%;
	transition: inherit;

	&:after {
		content: '';
		display: block;
		position: absolute;
		top: 3px;
		right: 3px;
		bottom: 3px;
		left: 3px;
		border-radius: 100%;
		opacity: 0;
		transform: scale(0);
		transition: 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
	}
}

.label {
	margin-left: 28px;
	display: block;
	line-height: 20px;
	cursor: pointer;
}
@-webkit-keyframes AnimationLight {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
@-moz-keyframes AnimationLight {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}  @keyframes AnimationLight {
     0% {
       background-position: 0% 50%
     }
     50% {
       background-position: 100% 50%
     }
     100% {
       background-position: 0% 50%
     }
   }
@-webkit-keyframes AnimationDark {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
@-moz-keyframes AnimationDark {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
@keyframes AnimationDark {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
</style>
