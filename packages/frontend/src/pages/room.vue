<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" class="_pageScrollable">
	<canvas ref="canvas" :class="$style.canvas"></canvas>
	<div class="_buttons" :class="$style.controls">
		<MkButton @click="grab">Grab</MkButton>
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

onMounted(() => {
	engine = new RoomEngine({
		roomType: 'default',
		objects: [{
			id: 'a',
			type: 'cardboard-box3',
			position: [120, 0, 50],
			rotation: [0, 0.2, 0],
		}, {
			id: 'b',
			type: 'cardboard-box2',
			position: [120, 31, 50],
			rotation: [0, 0.1, 0],
			sticky: 'a',
		}, {
			id: '1',
			type: 'cardboard-box',
			position: [80, 0, 110],
			rotation: [0, 2, 0],
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
			type: 'chair2',
			position: [-80, 0, 85],
			rotation: [0, -Math.PI / 2, 0],
		}, {
			id: 'f',
			type: 'plant',
			position: [-60, 90, 165],
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
		}],
	}, {
		canvas: canvas.value!,
	});

	engine.init();

	canvas.value!.focus();
});

onUnmounted(() => {
	engine.destroy();
});

function onKeydown(ev: KeyboardEvent) {
	if (ev.key === 'w') {
		engine.moveForward = true;
	} else if (ev.key === 's') {
		engine.moveBackward = true;
	} else if (ev.key === 'a') {
		engine.moveLeft = true;
	} else if (ev.key === 'd') {
		engine.moveRight = true;
	}
}

function onKeyup(ev: KeyboardEvent) {
	if (ev.key === 'w') {
		engine.moveForward = false;
	} else if (ev.key === 's') {
		engine.moveBackward = false;
	} else if (ev.key === 'a') {
		engine.moveLeft = false;
	} else if (ev.key === 'd') {
		engine.moveRight = false;
	}
}

function grab() {
	engine.grab();
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
