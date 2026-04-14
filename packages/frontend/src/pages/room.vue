<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" class="_pageScrollable">
	<div :class="[$style.screen, { [$style.zen]: isZenMode }]">
		<canvas ref="canvas" :class="$style.canvas" tabindex="-1"></canvas>

		<template v-if="!isZenMode">
			<div v-if="controller.isReady.value" class="_buttonsCenter" :class="$style.overlayControls">
				<template v-if="controller.isEditMode.value">
					<MkButton v-if="controller.grabbing.value && !controller.grabbing.value.forInstall" @click="endGrabbing"><i class="ti ti-check"></i> (E)</MkButton>
					<MkButton v-else-if="controller.grabbing.value && controller.grabbing.value.forInstall" @click="endGrabbing"><i class="ti ti-check"></i> (E)</MkButton>
					<MkButton v-else-if="controller.selected.value != null" @click="beginSelectedInstalledObjectGrabbing"><i class="ti ti-hand-grab"></i> (E)</MkButton>

					<MkButton v-if="controller.grabbing.value" @click="rotate"><i class="ti ti-view-360-arrow"></i> (R)</MkButton>

					<MkButton :primary="controller.gridSnapping.value.enabled" @click="showSnappingMenu">Grid Snap: {{ controller.gridSnapping.value.enabled ? 'on' : 'off' }}</MkButton>

					<MkButton v-if="!controller.grabbing.value && controller.selected.value != null" @click="removeSelectedObject"><i class="ti ti-trash"></i> (X)</MkButton>
				</template>
				<MkButton v-if="controller.isSitting.value" @click="controller.standUp()">降りる (Q)</MkButton>
				<template v-for="interaction in interacions" :key="interaction.id">
					<MkButton inline @click="interaction.fn()">{{ interaction.label }}{{ interaction.isPrimary ? ' (E)' : '' }}</MkButton>
				</template>
			</div>

			<div v-if="controller.isReady.value && controller.isEditMode.value && controller.selected.value != null" :key="controller.selected.value.objectId" class="_panel" :class="$style.overlayObjectInfoPanel">
				{{ controller.selected.value.objectDef.name }}

				<div class="_gaps">
					<div v-for="[k, s] in Object.entries(controller.selected.value.objectDef.options.schema)" :key="k">
						<div>{{ s.label }}</div>
						<div v-if="s.type === 'color'">
							<MkInput :modelValue="getHex(controller.selected.value.objectState.options[k])" type="color" @update:modelValue="v => { const c = getRgb(v); if (c != null) controller.updateObjectOption(controller.selected.value.objectId, k, c); }"></MkInput>
						</div>
						<div v-else-if="s.type === 'boolean'">
							<MkSwitch :modelValue="controller.selected.value.objectState.options[k]" @update:modelValue="v => controller.updateObjectOption(controller.selected.value.objectId, k, v)"></MkSwitch>
						</div>
						<div v-else-if="s.type === 'enum'">
							<MkSelect :items="s.enum.map(e => ({ label: e, value: e }))" :modelValue="controller.selected.value.objectState.options[k]" @update:modelValue="v => controller.updateObjectOption(controller.selected.value.objectId, k, v)"></MkSelect>
						</div>
						<div v-else-if="s.type === 'range'">
							<MkRange :continuousUpdate="true" :min="s.min" :max="s.max" :step="s.step" :modelValue="controller.selected.value.objectState.options[k]" @update:modelValue="v => controller.updateObjectOption(controller.selected.value.objectId, k, v)"></MkRange>
						</div>
						<div v-else-if="s.type === 'image'">
							<MkInput type="text" :modelValue="controller.selected.value.objectState.options[k]" @update:modelValue="v => controller.updateObjectOption(controller.selected.value.objectId, k, v)"></MkInput>
						</div>
					</div>
				</div>
			</div>
		</template>
	</div>

	<template v-if="!isZenMode">
		<div v-if="controller.isReady.value" class="_buttons" :class="$style.controls">
			<!--<MkButton v-for="action in actions" :key="action.key" @click="action.fn">{{ action.label }}{{ hotkeyToLabel(action.hotkey) }}</MkButton>-->
			<MkButton @click="toggleLight">Toggle Light</MkButton>
			<MkButton v-if="controller.isEditMode.value" primary @click="save">Save</MkButton>
			<MkButton v-if="controller.isEditMode.value" @click="exitEditMode">Exit edit mode</MkButton>
			<MkButton v-if="!controller.isEditMode.value" @click="enterEditMode">Edit mode</MkButton>
			<MkButton v-if="controller.isEditMode.value" @click="addObject">addObject</MkButton>
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
import MkSelect from '@/components/MkSelect.vue';
import * as os from '@/os.js';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import { RoomController } from '@/utility/room/controller.js';

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

const controller = new RoomController(data);

function onKeydown(ev: KeyboardEvent) {
	if (ev.code === 'KeyE') {
		ev.preventDefault();
		ev.stopPropagation();
		if (controller.isEditMode.value) {
			if (controller.grabbing.value) {
				endGrabbing();
			} else {
				beginSelectedInstalledObjectGrabbing();
			}
		} else if (controller.selected.value != null) {
			controller.interact(controller.selected.value.objectId);
		}
	} else if (ev.code === 'KeyR') {
		ev.preventDefault();
		ev.stopPropagation();
		if (controller.grabbing.value) {
			rotate();
		}
	} else if (ev.code === 'KeyQ') {
		ev.preventDefault();
		ev.stopPropagation();
		if (controller.isSitting.value) {
			controller.standUp();
		}
	} else if (ev.code === 'Tab') {
		ev.preventDefault();
		ev.stopPropagation();
		if (controller.isEditMode.value) {
			controller.exitEditMode();
			controller.isEditMode.value = false;
		} else {
			controller.enterEditMode();
			controller.isEditMode.value = true;
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
	if (controller.grabbing.value) {
		ev.preventDefault();
		ev.stopPropagation();

		controller.changeGrabbingDistance(ev.deltaY * 0.025);
	} else {
		ev.preventDefault();
		ev.stopPropagation();

		controller.camera.fov += ev.deltaY * 0.001;
		controller.camera.fov = Math.max(0.25, Math.min(1, controller.camera.fov));
	}
}

onMounted(async () => {
	controller.init(canvas.value!);

	canvas.value!.focus();

	window.addEventListener('resize', resize);

	//watch(controller.selected, (v) => {
	//	if (v == null) {
	//		interacions.value = [];
	//	} else {
	//		interacions.value = Object.entries(v.objectEntity.instance.interactions).map(([interactionId, interactionInfo]) => ({
	//			id: interactionId,
	//			label: interactionInfo.label,
	//			isPrimary: v.objectEntity.instance.primaryInteraction === interactionId,
	//			fn: interactionInfo.fn,
	//		}));
	//	}
	//});
});

onUnmounted(() => {
	controller.destroy();

	window.removeEventListener('resize', resize);
});

function beginSelectedInstalledObjectGrabbing() {
	controller.beginSelectedInstalledObjectGrabbing();
	canvas.value!.focus();
}

function endGrabbing() {
	controller.endGrabbing();
	canvas.value!.focus();
}

function toggleLight() {
	controller.toggleRoomLight();
	canvas.value!.focus();
}

function showSnappingMenu(ev: PointerEvent) {
	os.popupMenu([{
		type: 'switch',
		text: i18n.ts._room.snapToGrid,
		ref: computed({
			get: () => controller.gridSnapping.value.enabled,
			set: v => controller.setGridSnapping({ ...controller.gridSnapping.value, enabled: v }),
		}),
	}, {
		type: 'radioOption',
		text: '1cm',
		active: computed(() => controller.gridSnapping.value.scale === 1),
		action: () => controller.setGridSnapping({ ...controller.gridSnapping.value, scale: 1 }),
	}, {
		type: 'radioOption',
		text: '2cm',
		active: computed(() => controller.gridSnapping.value.scale === 2),
		action: () => controller.setGridSnapping({ ...controller.gridSnapping.value, scale: 2 }),
	}, {
		type: 'radioOption',
		text: '4cm',
		active: computed(() => controller.gridSnapping.value.scale === 4),
		action: () => controller.setGridSnapping({ ...controller.gridSnapping.value, scale: 4 }),
	}, {
		type: 'radioOption',
		text: '8cm',
		active: computed(() => controller.gridSnapping.value.scale === 8),
		action: () => controller.setGridSnapping({ ...controller.gridSnapping.value, scale: 8 }),
	}], ev.currentTarget ?? ev.target);
}

function rotate() {
	controller.changeGrabbingRotationY(Math.PI / 8);
	canvas.value!.focus();
}

async function addObject(ev: PointerEvent) {
	const { dispose } = await os.popupAsyncWithDialog(import('./room.add-object-dialog.vue').then(x => x.default), {
	}, {
		ok: async (res) => {
			controller.addObject(res);
			canvas.value!.focus();
		},
		closed: () => dispose(),
	});
}

function removeSelectedObject() {
	controller.removeSelectedObject();
	canvas.value!.focus();
}

function enterEditMode() {
	controller.enterEditMode();
}

function exitEditMode() {
	controller.exitEditMode();
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
	localStorage.setItem('roomData', JSON.stringify(controller.roomState));
}

function expor() {
	const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(controller.roomState));
	const dlAnchorElem = window.document.createElement('a');
	dlAnchorElem.setAttribute('href', dataStr);
	dlAnchorElem.setAttribute('download', 'room.json');
	dlAnchorElem.click();
}

function impor() {
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
