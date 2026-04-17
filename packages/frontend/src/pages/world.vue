<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" class="_pageScrollable">
	<div :class="[$style.screen, { [$style.zen]: isZenMode }]">
		<canvas ref="canvas" :class="$style.canvas" tabindex="-1" :style="{ visibility: controller.isReady.value ? 'visible' : 'hidden' }"></canvas>

		<Transition
			:enterActiveClass="$style.transition_fade_enterActive"
			:leaveActiveClass="$style.transition_fade_leaveActive"
			:enterFromClass="$style.transition_fade_enterFrom"
			:leaveToClass="$style.transition_fade_leaveTo"
		>
			<div v-if="!controller.isReady.value" :class="$style.loading">
				<div :class="$style.progressBar">
					<div :class="$style.progressBarValue" :style="{ width: `${controller.initializeProgress.value * 100}%` }"></div>
				</div>
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
}

.screen {
	position: relative;
	width: 100%;
	height: 90cqh;
}
.screen.zen {
	height: 100%;
}

.canvas {
	width: 100%;
	height: 100%;
	display: block;
	background: #000;

	&:focus {
		outline: none;
	}
}

.controls {
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
	height: 4px;
	border-radius: 999px;
	overflow: clip;
	background-color: var(--MI_THEME-accentedBg);
}

.progressBarValue {
	height: 100%;
	background: linear-gradient(90deg, var(--MI_THEME-buttonGradateA), var(--MI_THEME-buttonGradateB));
	transition: all 0.5s cubic-bezier(0,.5,.5,1);
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
