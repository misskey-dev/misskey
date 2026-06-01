<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="joystickEl" :class="$style.joystick" :style="{ '--startXPx': (joystickStartPos?.x ?? 0) + 'px', '--startYPx': (joystickStartPos?.y ?? 0) + 'px', '--rPx': joystickRadiusPx + 'px' }">
	<div v-show="joystickStartPos != null" :class="$style.joystickRangeCircle"></div>
	<div v-show="joystickVec.x !== 0 || joystickVec.y !== 0" :class="$style.joystickPuck" :style="{ '--x': joystickVec.x, '--y': joystickVec.y }"></div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref, useTemplateRef } from 'vue';
import { Joystick } from '@/world/joystick.js';

const emit = defineEmits<{
	(ev: 'update', vector: { x: number; y: number; }): void;
}>();

const joystickRadiusPx = 100;
const joystickEl = useTemplateRef('joystickEl');
const joystickVec = ref({ x: 0, y: 0 });
const joystickStartPos = ref<{ x: number; y: number } | null>(null);

onMounted(async () => {
	if (joystickEl.value != null) {
		const joystick = new Joystick(joystickEl.value!, { radiusPx: joystickRadiusPx });
		joystick.on('start', (vector) => {
			joystickStartPos.value = vector;
		});
		joystick.on('end', () => {
			joystickStartPos.value = null;
		});
		joystick.on('updateVector', (vector) => {
			joystickVec.value = vector;
			emit('update', vector);
		});
	}
});
</script>

<style lang="scss" module>
.joystick {
	position: relative;
	width: 50%;
	height: 100px;
	box-sizing: border-box;
	padding: 8px;
	touch-action: none;
	pointer-events: auto;
}

.joystick::before {
	content: '';
	display: block;
	width: 100%;
	height: 100%;
	border: solid 2px #fff;
	border-radius: 16px;
	pointer-events: none;
}

.joystickRangeCircle {
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

.joystickPuck {
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
</style>
