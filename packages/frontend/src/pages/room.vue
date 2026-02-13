<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" class="_pageScrollable">
	<canvas ref="canvas" :class="$style.canvas"></canvas>
	<div class="_buttons" :class="$style.controls">
		<MkButton @click="grab">Grab</MkButton>
		<MkButton @click="toggleLight">Toggle Light</MkButton>
		<MkButton @click="toggleGridSnapping">Grid Snap: {{ gridSnapping }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, onMounted, onUnmounted, ref, shallowRef, useTemplateRef } from 'vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import { ensureSignin } from '@/i';
import MkButton from '@/components/MkButton.vue';
import { RoomEngine } from '@/utility/room/engine.js';

const canvas = useTemplateRef('canvas');

let engine: RoomEngine;

function resize() {
	if (engine != null) engine.resize();
}

onMounted(() => {
	engine = new RoomEngine({
		roomType: 'default',
		objects: [{
			id: 'a',
			type: 'cardboard-box',
			position: [120, 0, 50],
			rotation: [0, 0.2, 0],
			variation: 'mikan',
		}, {
			id: 'a2',
			type: 'opened-cardboard-box',
			position: [115, 0, -20],
			rotation: [0, -0.1, 0],
		}, {
			id: 'b',
			type: 'cardboard-box',
			position: [120, 31, 50],
			rotation: [0, 0.1, 0],
			sticky: 'a',
			variation: 'aizon',
		}, {
			id: '1',
			type: 'cardboard-box',
			position: [80, 0, 110],
			rotation: [0, 2, 0],
			variation: null,
		}, {
			id: 'c',
			type: 'desk',
			position: [-115, 0, 85],
			rotation: [0, 0, 0],
		}, {
			id: 'd',
			type: 'monitor',
			position: [-130, 70, 85],
			rotation: [0, 0, 0],
			sticky: 'c',
		}, {
			id: 'd2',
			type: 'keyboard',
			position: [-110, 70, 85],
			rotation: [0, 0, 0],
			sticky: 'c',
		}, {
			id: 'e',
			type: 'chair',
			position: [-80, 0, 85],
			rotation: [0, -Math.PI, 0],
		}, {
			id: 'f',
			type: 'plant',
			position: [-60, 90, 165],
			rotation: [0, 0, 0],
		}, {
			id: 'f2',
			type: 'monstera',
			position: [-55, 90, 175],
			rotation: [0, 0, 0],
		}, {
			id: 'g',
			type: 'mug',
			position: [-45, 90, 160],
			rotation: [0, Math.PI / 2, 0],
		}, {
			id: 'h',
			type: 'aircon',
			position: [80, 215, 150],
			rotation: [0, Math.PI / 2, 0],
		}, {
			id: 'i',
			type: 'lava-lamp',
			position: [60, 90, 170],
			rotation: [0, 0, 0],
		}, {
			id: 'j',
			type: 'steel-rack',
			position: [130, 0, 115],
			rotation: [0, 0, 0],
		}, {
			id: 'j2',
			type: 'aquarium',
			position: [130, 100, 115],
			rotation: [0, Math.PI, 0],
			sticky: 'j',
		}, {
			id: 'k',
			type: 'cup-noodle',
			position: [-100, 70, 40],
			rotation: [0, -2, 0],
			sticky: 'c',
		}, {
			id: 'l',
			type: 'banknote',
			position: [-100, 70, 55],
			rotation: [0, -2, 0],
			sticky: 'c',
		}, {
			id: 'm',
			type: 'energy-drink',
			position: [-100, 70, 120],
			rotation: [0, 1, 0],
			sticky: 'c',
		}, {
			id: 'n',
			type: 'milk',
			position: [-120, 70, 130],
			rotation: [0, 1.5, 0],
			sticky: 'c',
		}, {
			id: 'o',
			type: 'facial-tissue',
			position: [-100, 70, 138],
			rotation: [0, 1.5, 0],
			sticky: 'c',
		}, {
			id: 'p',
			type: 'tv',
			position: [-135, 88, -5],
			rotation: [0, 0, 0],
		}, {
			id: 'q',
			type: 'color-box',
			position: [-135, 0, -5],
			rotation: [0, 0, 0],
		}, {
			id: 'r',
			type: 'plant2',
			position: [135, 0, -135],
			rotation: [0, 0, 0],
		}, {
			id: 's',
			type: 'wall-clock',
			position: [-150, 200, 100],
			rotation: [0, 0, 0],
		}, {
			id: 't',
			type: 'book',
			position: [10, 100, 10],
			rotation: [0, 0, 0],
			variation: 1,
		}, {
			id: 'u',
			type: 'bed',
			position: [-30, 0, -100],
			rotation: [0, 0, 0],
		}, {
			id: 'v',
			type: 'ceiling-fan-light',
			position: [0, 250, 0],
			rotation: [0, 0, 0],
			isMainLight: true,
		}, {
			id: 'w',
			type: 'round-rug',
			position: [0, 0, 0],
			rotation: [0, 0, 0],
		}],
	}, {
		canvas: canvas.value!,
	});

	engine.init();

	canvas.value!.focus();

	window.addEventListener('resize', resize);
});

onUnmounted(() => {
	engine.destroy();

	window.removeEventListener('resize', resize);
});

function grab() {
	engine.toggleGrab();
	canvas.value!.focus();
}

function toggleLight() {
	engine.toggleRoomLight();
	canvas.value!.focus();
}

const gridSnapping = ref(false);

function toggleGridSnapping() {
	gridSnapping.value = !gridSnapping.value;
	engine.enableGridSnapping = gridSnapping.value;
	canvas.value!.focus();
}

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

.canvas {
	width: 100%;
	height: 100%;
	display: block;
	background: #000;
}

.controls {
	position: absolute;
	bottom: 16px;
	left: 0;
	width: 100%;
}
</style>
