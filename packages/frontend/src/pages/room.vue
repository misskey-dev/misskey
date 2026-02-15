<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" class="_pageScrollable">
	<canvas ref="canvas" :class="$style.canvas"></canvas>
	<div v-if="engine != null" class="_buttons" :class="$style.controls">
		<MkButton @click="toggleLight">Toggle Light</MkButton>
		<MkButton :primary="engine.isEditMode.value" @click="toggleEditMode">Edit mode: {{ engine.isEditMode.value ? 'on' : 'off' }}</MkButton>
		<template v-if="engine.isEditMode.value">
			<MkButton @click="grab">Grab (E)</MkButton>
			<MkButton :primary="engine.enableGridSnapping.value" @click="toggleGridSnapping">Grid Snap: {{ engine.enableGridSnapping.value ? 'on' : 'off' }}</MkButton>
			<MkButton v-if="engine.enableGridSnapping.value" :primary="engine.gridSnappingScale.value === 1" @click="engine.gridSnappingScale.value = 1">Snap: 1cm</MkButton>
			<MkButton v-if="engine.enableGridSnapping.value" :primary="engine.gridSnappingScale.value === 2" @click="engine.gridSnappingScale.value = 2">Snap: 2cm</MkButton>
			<MkButton v-if="engine.enableGridSnapping.value" :primary="engine.gridSnappingScale.value === 4" @click="engine.gridSnappingScale.value = 4">Snap: 4cm</MkButton>
			<MkButton v-if="engine.enableGridSnapping.value" :primary="engine.gridSnappingScale.value === 8" @click="engine.gridSnappingScale.value = 8">Snap: 8cm</MkButton>
		</template>
		<MkButton v-if="engine.isSitting.value" @click="engine.standUp()">降りる (Q)</MkButton>
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

const engine = shallowRef<RoomEngine | null>(null);

function resize() {
	if (engine.value != null) engine.value.resize();
}

onMounted(() => {
	engine.value = new RoomEngine({
		roomType: 'default',
		objects: [/*{
			id: 'a',
			type: 'cardboard-box',
			position: [120, 0, 50],
			rotation: [0, 0.2, 0],
			options: {
				variation: 'mikan',
			},
		}, {
			id: 'a2',
			type: 'opened-cardboard-box',
			position: [115, 0, -20],
			rotation: [0, -0.1, 0],
			options: {},
		}, {
			id: 'b',
			type: 'cardboard-box',
			position: [120, 31, 50],
			rotation: [0, 0.1, 0],
			sticky: 'a',
			options: {
				variation: 'aizon',
			},
		}, {
			id: '1',
			type: 'cardboard-box',
			position: [80, 0, 110],
			rotation: [0, 2, 0],
			options: {
				variation: null,
			},
		}, {
			id: 'c',
			type: 'desk',
			position: [-115, 0, 85],
			rotation: [0, Math.PI, 0],
			options: {},
		}, {
			id: 'd',
			type: 'monitor',
			position: [-130, 70, 85],
			rotation: [0, -Math.PI / 2, 0],
			sticky: 'c',
			options: {},
		}, {
			id: 'd2',
			type: 'keyboard',
			position: [-110, 70, 85],
			rotation: [0, Math.PI, 0],
			sticky: 'c',
			options: {},
		}, {
			id: 'e',
			type: 'chair',
			position: [-75, 0, 85],
			rotation: [0, Math.PI / 2, 0],
			options: {},
		}, {
			id: 'f',
			type: 'plant',
			position: [-60, 90, 165],
			rotation: [0, 0, 0],
			options: {},
		}, {
			id: 'f2',
			type: 'monstera',
			position: [-55, 90, 175],
			rotation: [0, 0, 0],
			options: {},
		}, {
			id: 'f3',
			type: 'snakeplant',
			position: [40, 90, 170],
			rotation: [0, 0, 0],
			options: {},
		}, {
			id: 'g',
			type: 'mug',
			position: [-45, 90, 160],
			rotation: [0, Math.PI / 2, 0],
			options: {},
		}, {
			id: 'h',
			type: 'aircon',
			position: [80, 215, 150],
			rotation: [0, Math.PI, 0],
			options: {},
		}, {
			id: 'i',
			type: 'lava-lamp',
			position: [60, 90, 170],
			rotation: [0, 0, 0],
			options: {},
		}, {
			id: 'j',
			type: 'steel-rack',
			position: [130, 0, 115],
			rotation: [0, Math.PI / 2, 0],
			options: {},
		}, {
			id: 'j2',
			type: 'aquarium',
			position: [130, 100, 115],
			rotation: [0, Math.PI / 2, 0],
			sticky: 'j',
			options: {},
		}, {
			id: 'j3',
			type: 'power-strip',
			position: [130, 13, 115],
			rotation: [0, Math.PI / 2, 0],
			sticky: 'j',
			options: {},
		}, {
			id: 'k',
			type: 'cup-noodle',
			position: [-100, 70, 40],
			rotation: [0, -2, 0],
			sticky: 'c',
			options: {},
		}, {
			id: 'l',
			type: 'banknote',
			position: [-100, 70, 55],
			rotation: [0, 2, 0],
			sticky: 'c',
			options: {},
		}, {
			id: 'm',
			type: 'energy-drink',
			position: [-100, 70, 120],
			rotation: [0, -1, 0],
			sticky: 'c',
			options: {},
		}, {
			id: 'n',
			type: 'milk',
			position: [-120, 70, 130],
			rotation: [0, 1.5, 0],
			sticky: 'c',
			options: {},
		}, {
			id: 'o',
			type: 'facial-tissue',
			position: [-100, 70, 138],
			rotation: [0, -1.5, 0],
			sticky: 'c',
			options: {},
		}, {
			id: 'p',
			type: 'tv',
			position: [-135, 88, -5],
			rotation: [0, -Math.PI / 2, 0],
			options: {},
		}, {
			id: 'q',
			type: 'color-box',
			position: [-135, 0, -5],
			rotation: [0, -Math.PI / 2, 0],
			options: {},
		}, {
			id: 'r',
			type: 'plant2',
			position: [135, 0, -135],
			rotation: [0, 0, 0],
			options: {},
		}, {
			id: 's',
			type: 'wall-clock',
			position: [-150, 200, 100],
			rotation: [0, -Math.PI / 2, 0],
			options: {},
		}, {
			id: 's2',
			type: 'wood-sound-absorbing-panel',
			position: [-150, 140, 80],
			rotation: [0, -Math.PI / 2, 0],
			options: {},
		}, {
			id: 't',
			type: 'book',
			position: [10, 100, 10],
			rotation: [0, 0, 0],
			options: {
				variation: 1,
			},
		}, {
			id: 'u',
			type: 'bed',
			position: [-30, 0, -100],
			rotation: [0, Math.PI, 0],
			options: {},
		}, {
			id: 'v',
			type: 'ceiling-fan-light',
			position: [0, 250, 0],
			rotation: [0, 0, 0],
			isMainLight: true,
			options: {},
		}, {
			id: 'w',
			type: 'round-rug',
			position: [0, 0, 0],
			rotation: [0, 0, 0],
			options: {},
		}, */{
				id: 'x',
				type: 'blind',
				position: [-35, 194, 185],
				rotation: [0, Math.PI, 0],
				options: {
					blades: 24,
					angle: 0.5,
					open: 0.8,
				},
			}, {
				id: 'x2',
				type: 'blind',
				position: [35, 194, 185],
				rotation: [0, Math.PI, 0],
				options: {
					blades: 24,
					angle: -0.4,
					open: 0.5,
				},
			}],
	}, {
		canvas: canvas.value!,
	});

	engine.value.init();

	canvas.value!.focus();

	window.addEventListener('resize', resize);
});

onUnmounted(() => {
	engine.value.destroy();

	window.removeEventListener('resize', resize);
});

function grab() {
	engine.value.toggleGrab();
	canvas.value!.focus();
}

function toggleLight() {
	engine.value.toggleRoomLight();
	canvas.value!.focus();
}

function toggleGridSnapping() {
	engine.value.enableGridSnapping.value = !engine.value.enableGridSnapping.value;
	canvas.value!.focus();
}

function toggleEditMode() {
	engine.value.isEditMode.value = !engine.value.isEditMode.value;
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
