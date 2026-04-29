<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div :class="[$style.screen, { [$style.zen]: isZenMode }]">
		<canvas ref="canvas" :class="$style.canvas" tabindex="-1" :style="{ visibility: controller.isReady.value ? 'visible' : 'hidden' }"></canvas>

		<Transition
			:enterActiveClass="$style.transition_fade_enterActive"
			:leaveActiveClass="$style.transition_fade_leaveActive"
			:enterFromClass="$style.transition_fade_enterFrom"
			:leaveToClass="$style.transition_fade_leaveTo"
		>
			<div v-if="!controller.isReady.value" :class="$style.loading">
				<MkProgressBar :class="$style.progressBar" :progress="controller.initializeProgress.value" :waiting="controller.initializeProgress.value === 1"/>
			</div>
		</Transition>

		<template v-if="!isZenMode">
			<div v-if="controller.isReady.value" class="_buttonsCenter" :class="$style.overlayControls">
			</div>
		</template>
	</div>

	<template v-if="!isZenMode">
		<div v-if="controller.isReady.value" class="_buttons" :class="$style.controls">
		</div>
	</template>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import { ensureSignin } from '@/i';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import * as os from '@/os.js';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import { WorldController } from '@/world/controller.js';

const canvas = useTemplateRef('canvas');

const interacions = shallowRef<{
	id: string;
	label: string;
	isPrimary: boolean;
	fn: () => void;
}[]>([]);

function resize() {
	controller.resize();
}

const isZenMode = ref(false);

const controller = new WorldController();

onMounted(async () => {
	controller.init(canvas.value!);

	canvas.value!.focus();

	window.addEventListener('resize', resize);
});

onUnmounted(() => {
	controller.destroy();

	window.removeEventListener('resize', resize);
});

definePage(() => ({
	title: 'Room',
	icon: 'ti ti-door',
	needWideArea: true,
}));
</script>

<style lang="scss" module>
.root {
	height: 100%;
	overflow: clip;
	background: var(--MI_THEME-bg);
}

.screen {
	position: relative;
	width: 100%;
	height: 100cqh;
	overflow: clip;
}

.canvas {
	width: 100%;
	height: 100%;
	display: block;
	touch-action: none;
	background: #000;

	&:focus {
		outline: none;
	}
}

.joyStick {
	position: relative;
	width: 50%;
	height: 100px;
	box-sizing: border-box;
	padding: 8px;
	touch-action: none;
}

.joyStick::before {
	content: '';
	display: block;
	width: 100%;
	height: 100%;
	border: solid 2px #fff;
	border-radius: 16px;
	pointer-events: none;
}

.joyStickRangeCircle {
	position: absolute;
	top: var(--startYPx);
	left: var(--startXPx);
	width: calc(var(--rPx) * 2);
	height: calc(var(--rPx) * 2);
	border: solid 2px rgba(255, 255, 255, 0.5);
	border-radius: 100%;
	transform: translate(-50%, -50%);
	pointer-events: none;
}

.joyStickPuck {
	position: absolute;
	top: calc(var(--startYPx) + (var(--y) * var(--rPx)));
	left: calc(var(--startXPx) + (var(--x) * var(--rPx)));
	width: 30px;
	height: 30px;
	background: #fff;
	border-radius: 100%;
	transform: translate(-50%, -50%);
	pointer-events: none;
}

.overlayTop {
	position: absolute;
	top: 0;
	left: 0;
	z-index: 1;
	width: 100%;
}

.overlayBottom {
	position: absolute;
	bottom: 0;
	left: 0;
	z-index: 1;
	width: 100%;
}

.topMain {
	display: flex;
	align-items: center;
	gap: 16px;
}

.topMenu {
	margin: 16px;
	display: flex;
	box-sizing: border-box;
	width: max-content;
}

.topMenuButton {
	padding: 8px;
}
.topMenuButton:first-child {
	padding-left: 16px;
}
.topMenuButton:last-child {
	padding-right: 16px;
}

.modified {
	display: flex;
	align-items: center;
	font-size: 90%;
	gap: 1em;
	padding: 8px 16px;
}

.modifiedText {
	color: var(--MI_THEME-warn);
	animation: modified-blink 2s infinite;
}

@keyframes modified-blink {
	0% { opacity: 1; }
	50% { opacity: 0.5; }
	100% { opacity: 1; }
}

.overlayControls {

}

.overlayObjectInfoPanel {
	position: absolute;
	top: 16px;
	right: 16px;
	z-index: 1;
	padding: 16px;
	box-sizing: border-box;
	width: 300px;
}

.loading {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: grid;
	place-items: center;
	background: var(--MI_THEME-bg);
}

.progressBar {
	width: 75%;
}

.transition_fade_enterActive,
.transition_fade_leaveActive {
	transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.transition_fade_enterFrom,
.transition_fade_leaveTo {
	opacity: 0;
}
</style>
