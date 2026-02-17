<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" class="_pageScrollable">
	<canvas ref="canvas" :class="$style.canvas" @keypress="onKeypress" @wheel="onWheel"></canvas>
	<div v-if="engine != null" class="_buttons" :class="$style.controls">
		<!--<MkButton v-for="action in actions" :key="action.key" @click="action.fn">{{ action.label }}{{ hotkeyToLabel(action.hotkey) }}</MkButton>-->
		<MkButton :primary="engine.isEditMode.value" @click="toggleEditMode">Edit mode: {{ engine.isEditMode.value ? 'on' : 'off' }}</MkButton>
		<template v-if="engine.isEditMode.value">
			<MkButton v-if="engine.ui.isGrabbing" @click="endGrabbing">Put (E)</MkButton>
			<MkButton v-else-if="engine.ui.isGrabbingForInstall" @click="endGrabbing">Install (E)</MkButton>
			<MkButton v-else @click="beginSelectedInstalledObjectGrabbing">Grab (E)</MkButton>

			<MkButton :primary="engine.enableGridSnapping.value" @click="showSnappingMenu">Grid Snap: {{ engine.enableGridSnapping.value ? 'on' : 'off' }}</MkButton>
		</template>
		<MkButton v-if="engine.isSitting.value" @click="engine.standUp()">降りる (Q)</MkButton>
		<template v-for="interaction in interacions" :key="interaction.id">
			<MkButton @click="interaction.fn()">{{ interaction.label }}</MkButton>
		</template>
		<MkButton @click="addObject">addObject</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import { ensureSignin } from '@/i';
import MkButton from '@/components/MkButton.vue';
import { RoomEngine } from '@/utility/room/engine.js';
import { getObjectDef } from '@/utility/room/object-defs.js';
import MkSelect from '@/components/MkSelect.vue';
import * as os from '@/os.js';

const canvas = useTemplateRef('canvas');

const engine = shallowRef<RoomEngine | null>(null);

const interacions = shallowRef<{
	id: string;
	label: string;
	fn: () => void;
}[]>([]);

function resize() {
	if (engine.value != null) engine.value.resize();
}

type Action = {
	key: string;
	label: string;
	fn: () => void;
	hotkey?: string;
};

function hotkeyToLabel(hotkey: string) {
	if (hotkey.startsWith('Key')) {
		return hotkey.slice(3);
	} else if (hotkey.startsWith('Digit')) {
		return hotkey.slice(5);
	} else {
		return hotkey;
	}
}

const actions = computed<Action[]>(() => {
	if (engine.value == null) return [];

	const actions: Action[] = [];

	if (engine.value.isEditMode.value) {
		actions.push({
			key: 'grab',
			label: 'Grab',
			fn: () => {
				engine.value!.beginSelectedInstalledObjectGrabbing();
				canvas.value!.focus();
			},
			hotkey: 'KeyE',
		});
	}

	if (engine.value.isSitting.value) {
		actions.push({
			key: 'standUp',
			label: 'Stand Up',
			fn: () => engine.value!.standUp(),
			hotkey: 'KeyQ',
		});
	}

	return actions;
});

function onKeypress(ev: KeyboardEvent) {
	if (engine.value == null) return;

	/* todo
	if (ev.code === 'KeyE') {
		ev.preventDefault();
		ev.stopPropagation();
		if (engine.value.isEditMode.value) {
			if (engine.value.ui.isGrabbing || engine.value.ui.isGrabbingForInstall) {
				this.endGrabbing();
			} else {
				this.beginSelectedInstalledObjectGrabbing();
			}
		} else if (this.selectedObjectId.value != null) {
			this.interact(this.selectedObjectId.value);
		}
	} else if (ev.code === 'KeyR') {
		ev.preventDefault();
		ev.stopPropagation();
		if (this.grabbingCtx != null) {
			this.grabbingCtx.rotation += Math.PI / 8;
		}
	} else if (ev.code === 'KeyQ') {
		ev.preventDefault();
		ev.stopPropagation();
		if (this.isSitting.value) {
			this.standUp();
		}
	}
		*/
}

function onWheel(ev: WheelEvent) {
	if (engine.value == null) return;

	if (engine.value.ui.isGrabbing || engine.value.ui.isGrabbingForInstall) {
		ev.preventDefault();
		ev.stopPropagation();

		engine.value.changeGrabbingDistance(ev.deltaY * 0.025);
	}
}

onMounted(() => {
	engine.value = new RoomEngine({
		roomType: 'default',
		installedObjects: [{
			id: 'a',
			type: 'cardboardBox',
			position: [120, 0, 50],
			rotation: [0, 0.2, 0],
			options: {
				variation: 'mikan',
			},
		}, {
			id: 'a2',
			type: 'openedCardboardBox',
			position: [115, 0, -20],
			rotation: [0, -0.1, 0],
			options: {},
		}, {
			id: 'b',
			type: 'cardboardBox',
			position: [120, 31, 50],
			rotation: [0, 0.1, 0],
			sticky: 'a',
			options: {
				variation: 'aizon',
			},
		}, {
			id: '1',
			type: 'cardboardBox',
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
			id: 'f22',
			type: 'tabletopDigitalClock',
			position: [-35, 90, 175],
			rotation: [0, Math.PI, 0],
			options: {},
		}, {
			id: 'f3',
			type: 'snakeplant',
			position: [40, 90, 170],
			rotation: [0, 0, 0],
			options: {},
		}, {
			id: 'f4',
			type: 'cactusS',
			position: [50, 90, 155],
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
			type: 'lavaLamp',
			position: [60, 90, 170],
			rotation: [0, 0, 0],
			options: {},
		}, {
			id: 'j',
			type: 'steelRack',
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
			id: 'j4',
			type: 'letterCase',
			position: [130, 59, 125],
			rotation: [0, Math.PI / 2, 0],
			sticky: 'j',
			options: {},
		}, {
			id: 'j3',
			type: 'powerStrip',
			position: [130, 13, 115],
			rotation: [0, Math.PI / 2, 0],
			sticky: 'j',
			options: {},
		}, {
			id: 'k',
			type: 'cupNoodle',
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
			type: 'energyDrink',
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
			type: 'facialTissue',
			position: [-100, 70, 138],
			rotation: [0, -1.5, 0],
			sticky: 'c',
			options: {},
		}, {
			id: 'p',
			type: 'tv',
			position: [-135, 88, -5],
			rotation: [0, -Math.PI / 2, 0],
			sticky: 'q',
			options: {},
		}, {
			id: 'q',
			type: 'colorBox',
			position: [-135, 0, -5],
			rotation: [0, -Math.PI / 2, 0],
			options: {},
		}, {
			id: 'r',
			type: 'pachira',
			position: [135, 0, -135],
			rotation: [0, 0, 0],
			options: {},
		}, {
			id: 's',
			type: 'wallClock',
			position: [-150, 200, 100],
			rotation: [0, -Math.PI / 2, 0],
			options: {},
		}, {
			id: 's2',
			type: 'woodSoundAbsorbingPanel',
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
			type: 'ceilingFanLight',
			position: [0, 250, 0],
			rotation: [0, 0, 0],
			isMainLight: true,
			options: {},
		}, {
			id: 'w',
			type: 'roundRug',
			position: [0, 0, 0],
			rotation: [0, 0, 0],
			options: {},
		}, {
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

	watch(engine.value.selectedObjectId, (v) => {
		if (v == null) {
			interacions.value = [];
		} else {
			const obji = engine.value.objectInstances.get(v)!;
			interacions.value = Object.entries(obji.interactions).map(([interactionId, interactionInfo]) => ({
				id: interactionId,
				label: interactionInfo.label,
				fn: interactionInfo.fn,
			}));
		}
	});
});

onUnmounted(() => {
	engine.value.destroy();

	window.removeEventListener('resize', resize);
});

function beginSelectedInstalledObjectGrabbing() {
	engine.value.beginSelectedInstalledObjectGrabbing();
	canvas.value!.focus();
}

function endGrabbing() {
	engine.value.endGrabbing();
	canvas.value!.focus();
}

function toggleLight() {
	engine.value.toggleRoomLight();
	canvas.value!.focus();
}

function showSnappingMenu(ev: PointerEvent) {
	if (engine.value == null) return;
	os.popupMenu([{
		type: 'switch',
		text: i18n.ts._room.snapToGrid,
		ref: engine.value.enableGridSnapping,
	}, {
		type: 'radioOption',
		text: '1cm',
		active: computed(() => engine.value!.gridSnappingScale.value === 1),
		action: () => engine.value!.gridSnappingScale.value = 1,
	}, {
		type: 'radioOption',
		text: '2cm',
		active: computed(() => engine.value!.gridSnappingScale.value === 2),
		action: () => engine.value!.gridSnappingScale.value = 2,
	}, {
		type: 'radioOption',
		text: '4cm',
		active: computed(() => engine.value!.gridSnappingScale.value === 4),
		action: () => engine.value!.gridSnappingScale.value = 4,
	}, {
		type: 'radioOption',
		text: '8cm',
		active: computed(() => engine.value!.gridSnappingScale.value === 8),
		action: () => engine.value!.gridSnappingScale.value = 8,
	}], ev.currentTarget ?? ev.target);
}

function toggleGridSnapping() {
	engine.value.enableGridSnapping.value = !engine.value.enableGridSnapping.value;
	canvas.value!.focus();
}

function toggleEditMode() {
	engine.value.isEditMode.value = !engine.value.isEditMode.value;
	canvas.value!.focus();
}

function addObject() {
	engine.value?.addObject('mug');
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
