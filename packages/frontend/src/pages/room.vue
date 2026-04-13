<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" class="_pageScrollable">
	<div :class="[$style.screen, { [$style.zen]: isZenMode }]">
		<canvas ref="canvas" :class="$style.canvas" @keydown="onKeydown" @wheel="onWheel"></canvas>

		<template v-if="!isZenMode">
			<div v-if="engine != null" class="_buttonsCenter" :class="$style.overlayControls">
				<template v-if="isEditMode">
					<MkButton v-if="engine.ui.isGrabbing" @click="endGrabbing"><i class="ti ti-check"></i> (E)</MkButton>
					<MkButton v-else-if="engine.ui.isGrabbingForInstall" @click="endGrabbing"><i class="ti ti-check"></i> (E)</MkButton>
					<MkButton v-else-if="engine.selected.value != null" @click="beginSelectedInstalledObjectGrabbing"><i class="ti ti-hand-grab"></i> (E)</MkButton>

					<MkButton v-if="engine.ui.isGrabbing || engine.ui.isGrabbingForInstall" @click="rotate"><i class="ti ti-view-360-arrow"></i> (R)</MkButton>

					<MkButton :primary="engine.enableGridSnapping.value" @click="showSnappingMenu">Grid Snap: {{ engine.enableGridSnapping.value ? 'on' : 'off' }}</MkButton>

					<MkButton v-if="!engine.ui.isGrabbing && engine.selected.value != null" @click="removeSelectedObject"><i class="ti ti-trash"></i> (X)</MkButton>
				</template>
				<MkButton v-if="engine.isSitting.value" @click="engine.standUp()">降りる (Q)</MkButton>
				<template v-for="interaction in interacions" :key="interaction.id">
					<MkButton inline @click="interaction.fn()">{{ interaction.label }}{{ interaction.isPrimary ? ' (E)' : '' }}</MkButton>
				</template>
			</div>

			<div v-if="engine != null && isEditMode && engine.selected.value != null" :key="engine.selected.value.objectId" class="_panel" :class="$style.overlayObjectInfoPanel">
				{{ engine.selected.value.objectDef.name }}

				<div class="_gaps">
					<div v-for="[k, s] in Object.entries(engine.selected.value.objectDef.options.schema)" :key="k">
						<div>{{ s.label }}</div>
						<div v-if="s.type === 'color'">
							<MkInput :modelValue="getHex(engine.selected.value.objectState.options[k])" type="color" @update:modelValue="v => { const c = getRgb(v); if (c != null) engine.updateObjectOption(engine.selected.value.objectId, k, c); }"></MkInput>
						</div>
						<div v-else-if="s.type === 'boolean'">
							<MkSwitch :modelValue="engine.selected.value.objectState.options[k]" @update:modelValue="v => engine.updateObjectOption(engine.selected.value.objectId, k, v)"></MkSwitch>
						</div>
						<div v-else-if="s.type === 'enum'">
							<MkSelect :items="s.enum.map(e => ({ label: e, value: e }))" :modelValue="engine.selected.value.objectState.options[k]" @update:modelValue="v => engine.updateObjectOption(engine.selected.value.objectId, k, v)"></MkSelect>
						</div>
						<div v-else-if="s.type === 'range'">
							<MkRange :continuousUpdate="true" :min="s.min" :max="s.max" :step="s.step" :modelValue="engine.selected.value.objectState.options[k]" @update:modelValue="v => engine.updateObjectOption(engine.selected.value.objectId, k, v)"></MkRange>
						</div>
						<div v-else-if="s.type === 'image'">
							<MkInput type="text" :modelValue="engine.selected.value.objectState.options[k]" @update:modelValue="v => engine.updateObjectOption(engine.selected.value.objectId, k, v)"></MkInput>
						</div>
					</div>
				</div>
			</div>
		</template>
	</div>

	<template v-if="!isZenMode">
		<div v-if="engine != null" class="_buttons" :class="$style.controls">
			<!--<MkButton v-for="action in actions" :key="action.key" @click="action.fn">{{ action.label }}{{ hotkeyToLabel(action.hotkey) }}</MkButton>-->
			<MkButton @click="toggleLight">Toggle Light</MkButton>
			<MkButton v-if="isEditMode" primary @click="save">Save</MkButton>
			<MkButton v-if="isEditMode" @click="exitEditMode">Exit edit mode</MkButton>
			<MkButton v-if="!isEditMode" @click="enterEditMode">Edit mode</MkButton>
			<MkButton v-if="isEditMode" @click="addObject">addObject</MkButton>
			<MkButton @click="expor">Export</MkButton>
			<MkButton @click="impor">Import</MkButton>
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
import { createRoomEngine, RoomEngine } from '@/utility/room/engine.js';
import { getObjectDef, OBJECT_DEFS } from '@/utility/room/object-defs.js';
import MkSelect from '@/components/MkSelect.vue';
import * as os from '@/os.js';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';

const canvas = useTemplateRef('canvas');

const engine = shallowRef<RoomEngine | null>(null);

const isEditMode = ref(false);

const interacions = shallowRef<{
	id: string;
	label: string;
	isPrimary: boolean;
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

	if (isEditMode.value) {
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

const isZenMode = ref(false);

function onKeydown(ev: KeyboardEvent) {
	if (engine.value == null) return;

	console.log(ev.code);

	if (ev.code === 'KeyE') {
		ev.preventDefault();
		ev.stopPropagation();
		if (isEditMode.value) {
			if (engine.value.ui.isGrabbing || engine.value.ui.isGrabbingForInstall) {
				endGrabbing();
			} else {
				beginSelectedInstalledObjectGrabbing();
			}
		} else if (engine.value.selected.value != null) {
			engine.value.interact(engine.value.selected.value.objectId);
		}
	} else if (ev.code === 'KeyR') {
		ev.preventDefault();
		ev.stopPropagation();
		if (engine.value.ui.isGrabbing || engine.value.ui.isGrabbingForInstall) {
			rotate();
		}
	} else if (ev.code === 'KeyQ') {
		ev.preventDefault();
		ev.stopPropagation();
		if (engine.value.isSitting.value) {
			engine.value.standUp();
		}
	} else if (ev.code === 'Tab') {
		ev.preventDefault();
		ev.stopPropagation();
		if (isEditMode.value) {
			engine.value.exitEditMode();
			isEditMode.value = false;
		} else {
			engine.value.enterEditMode();
			isEditMode.value = true;
		}
	} else if (ev.code === 'KeyZ') {
		ev.preventDefault();
		ev.stopPropagation();
		isZenMode.value = !isZenMode.value;
		nextTick(() => {
			resize();
		});
	}
}

function onWheel(ev: WheelEvent) {
	if (engine.value == null) return;

	if (engine.value.ui.isGrabbing || engine.value.ui.isGrabbingForInstall) {
		ev.preventDefault();
		ev.stopPropagation();

		engine.value.changeGrabbingDistance(ev.deltaY * 0.025);
	} else {
		ev.preventDefault();
		ev.stopPropagation();

		engine.value.camera.fov += ev.deltaY * 0.001;
		engine.value.camera.fov = Math.max(0.25, Math.min(1, engine.value.camera.fov));
	}
}

const data = localStorage.getItem('roomData') != null ? { ...JSON.parse(localStorage.getItem('roomData')!), ...{
	heya: {
		type: 'simple',
		options: {
			dimension: [300, 300],
			window: 'demado',
			wallN: {
				material: null,
				color: [0.9, 0.9, 0.9],
			},
			wallE: {
				material: null,
				color: [0.33, 0.34, 0.35],
			},
			wallS: {
				material: null,
				color: [0.9, 0.9, 0.9],
			},
			wallW: {
				material: null,
				color: [0.9, 0.9, 0.9],
			},
			flooring: {
				material: 'wood',
				color: [0.9, 0.9, 0.9],
			},
			ceiling: {
				material: null,
				color: [0.9, 0.9, 0.9],
			},
		},
	},
} } : {
	heya: {
		type: 'simple',
		options: {
			dimension: [300, 300],
			window: 'demado',
			wallN: {
				material: null,
				color: [0.9, 0.9, 0.9],
			},
			wallE: {
				material: null,
				color: [0.9, 0.9, 0.9],
			},
			wallS: {
				material: null,
				color: [0.9, 0.9, 0.9],
			},
			wallW: {
				material: null,
				color: [0.9, 0.9, 0.9],
			},
			flooring: {
				material: 'wood',
				color: [0.9, 0.9, 0.9],
			},
			ceiling: {
				material: null,
				color: [0.9, 0.9, 0.9],
			},
		},
	},
	installedObjects: [],
};

onMounted(async () => {
	engine.value = await createRoomEngine(data, canvas.value!);

	engine.value.init();

	canvas.value!.focus();

	window.addEventListener('resize', resize);

	watch(engine.value.selected, (v) => {
		if (v == null) {
			interacions.value = [];
		} else {
			interacions.value = Object.entries(v.objectEntity.instance.interactions).map(([interactionId, interactionInfo]) => ({
				id: interactionId,
				label: interactionInfo.label,
				isPrimary: v.objectEntity.instance.primaryInteraction === interactionId,
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

function rotate() {
	engine.value.changeGrabbingRotationY(Math.PI / 8);
	canvas.value!.focus();
}

async function addObject(ev: PointerEvent) {
	if (engine.value == null) return;
	const { dispose } = await os.popupAsyncWithDialog(import('./room.add-object-dialog.vue').then(x => x.default), {
	}, {
		ok: async (res) => {
			engine.value?.addObject(res);
			canvas.value!.focus();
		},
		closed: () => dispose(),
	});
}

function removeSelectedObject() {
	engine.value?.removeSelectedObject();
	canvas.value!.focus();
}

function showBoundingBox() {
	engine.value?.showBoundingBox();
	canvas.value!.focus();
}

function enterEditMode() {
	engine.value?.enterEditMode();
	isEditMode.value = true;
}

function exitEditMode() {
	engine.value?.exitEditMode();
	isEditMode.value = false;
}

function getHex(c: [number, number, number]) {
	return `#${c.map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')}`;
}

function getRgb(hex: string | number): [number, number, number] | null {
	if (
		typeof hex === 'number' ||
		typeof hex !== 'string' ||
		!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)
	) {
		return null;
	}

	const m = hex.slice(1).match(/[0-9a-fA-F]{2}/g);
	if (m == null) return [0, 0, 0];
	return m.map(x => parseInt(x, 16) / 255) as [number, number, number];
}

function save() {
	if (engine.value == null) return;
	localStorage.setItem('roomData', JSON.stringify(engine.value.roomState));
}

function expor() {
	if (engine.value == null) return;
	const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(engine.value.roomState));
	const dlAnchorElem = window.document.createElement('a');
	dlAnchorElem.setAttribute('href', dataStr);
	dlAnchorElem.setAttribute('download', 'room.json');
	dlAnchorElem.click();
}

function impor() {
	if (engine.value == null) return;
	const inputElem = window.document.createElement('input');
	inputElem.setAttribute('type', 'file');
	inputElem.setAttribute('accept', 'application/json');
	inputElem.addEventListener('change', () => {
		const file = inputElem.files?.[0];
		if (file == null) return;
		const reader = new FileReader();
		reader.onload = () => {
			try {
				localStorage.setItem('roomData', reader.result as string);
				window.location.reload();
			} catch (e) {
				alert('Failed to load room data: ' + e);
			}
		};
		reader.readAsText(file);
	});
	inputElem.click();
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
}

.controls {
}

.overlayControls {
	position: absolute;
	bottom: 0;
	left: 0;
	z-index: 1;
	width: 100%;
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
</style>
