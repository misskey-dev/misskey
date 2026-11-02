<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- Media系専用のinput range -->
<template>
<div :class="$style.controlsSeekbar">
	<progress v-if="buffer !== undefined" :class="$style.buffer" :value="isNaN(buffer) ? 0 : buffer" min="0" max="1">{{ Math.round(buffer * 100) }}% buffered</progress>
	<input v-model="model" :class="$style.seek" :style="`--value: ${modelValue * 100}%;`" type="range" min="0" max="1" step="any" @change="emit('dragEnded', modelValue)"/>
</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

withDefaults(defineProps<{
	buffer?: number;
}>(), {
	buffer: undefined,
});

const emit = defineEmits<{
	(ev: 'dragEnded', value: number): void;
}>();

const model = defineModel<string | number>({ required: true });
const modelValue = computed({
	get: () => typeof model.value === 'number' ? model.value : parseFloat(model.value),
	set: v => { model.value = v; },
});
</script>

<style lang="scss" module>
.controlsSeekbar {
	position: relative;
	--sliderBg: light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.15));
	--thumbSize: 17px;
}

.seek {
	position: relative;
	-webkit-appearance: none;
	appearance: none;
	background: transparent;
	border: 0;
	border-radius: 26px;
	color: var(--MI_THEME-accent);
	display: block;
	height: 24px;
	margin: 0;
	min-width: 0;
	padding: 0;
	transition: box-shadow .3s ease;
	width: 100%;

	&::-webkit-slider-runnable-track {
		background-color: var(--sliderBg);
		background-image: linear-gradient(to right,currentColor var(--value,0),transparent var(--value,0));
		border: 0;
		border-radius: 99rem;
		height: 5px;
		transition: box-shadow .3s ease;
		user-select: none;
	}

	&::-moz-range-track {
		background: transparent;
		border: 0;
		border-radius: 99rem;
		height: 5px;
		transition: box-shadow .3s ease;
		user-select: none;
		background-color: var(--sliderBg);
	}

	&::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		background: #fff;
		border: 0;
		border-radius: 100%;
		box-shadow: 0 1px 1px rgba(35, 40, 47, .15),0 0 0 1px rgba(35, 40, 47, .2);
		height: var(--thumbSize);
		margin-top: calc((5px - var(--thumbSize)) / 2);
		position: relative;
		transition: all .2s ease;
		width: var(--thumbSize);

		&:active {
			box-shadow: 0 1px 1px rgba(35, 40, 47, .15), 0 0 0 1px rgba(35, 40, 47, .15), 0 0 0 3px rgba(255, 255, 255, .5);
		}
	}

	&::-moz-range-thumb {
		background: #fff;
		border: 0;
		border-radius: 100%;
		box-shadow: 0 1px 1px rgba(35, 40, 47, .15),0 0 0 1px rgba(35, 40, 47, .2);
		height: var(--thumbSize);
		position: relative;
		transition: all .2s ease;
		width: var(--thumbSize);

		&:active {
			box-shadow: 0 1px 1px rgba(35, 40, 47, .15), 0 0 0 1px rgba(35, 40, 47, .15), 0 0 0 3px rgba(255, 255, 255, .5);
		}
	}

	&::-moz-range-progress {
		background: currentColor;
		border-radius: 99rem;
		height: 5px;
	}
}

.buffer {
	appearance: none;
	background: transparent;
	color: color(from var(--MI_THEME-accent) srgb r g b / 0.25);
	border: 0;
	border-radius: 99rem;
	height: 5px;
	left: 0;
	margin-top: -2.5px;
	padding: 0;
	position: absolute;
	top: 50%;
	width: 100%;

	&::-webkit-progress-bar {
		background: transparent;
	}

	&::-webkit-progress-value {
		background: currentColor;
		border-radius: 100px;
		min-width: 5px;
		transition: width .2s ease;
	}

	&::-moz-progress-bar {
		background: currentColor;
		border-radius: 100px;
		min-width: 5px;
		transition: width .2s ease;
	}
}
</style>
