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
				<template v-if="controller.isEditMode.value">
					<MkButton v-if="controller.grabbing.value" @click="cancelGrabbing"><i class="ti ti-x"></i> cancel</MkButton>
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

			<div v-if="controller.isReady.value && controller.isEditMode.value && controller.selected.value != null && !controller.grabbing.value" :key="controller.selected.value.objectId" class="_panel" :class="$style.overlayObjectInfoPanel">
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

			<div v-if="isRoomSettingsOpen" class="_panel" :class="$style.overlayObjectInfoPanel">
				<div class="_gaps">
					Room options

					<MkSelect
						:items="[
							{ label: 'Simple', value: 'simple' },
						]" :modelValue="controller.roomState.value.heya.type" @update:modelValue="v => controller.changeHeyaType(v)"
					>
						<template #label>Heya type</template>
					</MkSelect>

					<template v-if="controller.roomState.value.heya.type === 'simple'">
						<div>
							<div>Wall N color</div>
							<MkInput :modelValue="getHex(controller.roomState.value.heya.options.wallN.color)" type="color" @update:modelValue="v => { const c = getRgb(v); if (c != null) controller.updateHeyaOptions({ ...controller.roomState.value.heya.options, wallN: { ...controller.roomState.value.heya.options.wallN, color: c } }); }"></MkInput>
						</div>
						<div>
							<div>Wall E color</div>
							<MkInput :modelValue="getHex(controller.roomState.value.heya.options.wallE.color)" type="color" @update:modelValue="v => { const c = getRgb(v); if (c != null) controller.updateHeyaOptions({ ...controller.roomState.value.heya.options, wallE: { ...controller.roomState.value.heya.options.wallE, color: c } }); }"></MkInput>
						</div>
						<div>
							<div>Wall W color</div>
							<MkInput :modelValue="getHex(controller.roomState.value.heya.options.wallW.color)" type="color" @update:modelValue="v => { const c = getRgb(v); if (c != null) controller.updateHeyaOptions({ ...controller.roomState.value.heya.options, wallW: { ...controller.roomState.value.heya.options.wallW, color: c } }); }"></MkInput>
						</div>
					</template>
				</div>
			</div>
		</template>
	</div>

	<template v-if="!isZenMode">
		<div v-if="controller.isReady.value" class="_buttons" :class="$style.controls">
			<!--<MkButton v-for="action in actions" :key="action.key" @click="action.fn">{{ action.label }}{{ hotkeyToLabel(action.hotkey) }}</MkButton>-->
			<MkButton @click="toggleLight">Toggle Light</MkButton>
			<MkButton v-if="controller.isEditMode.value" @click="exitEditMode">Exit edit mode</MkButton>
			<MkButton v-if="!controller.isEditMode.value" @click="enterEditMode">Edit mode</MkButton>
			<MkButton v-if="controller.isEditMode.value" @click="addObject">addObject</MkButton>
			<MkButton v-if="controller.isEditMode.value" @click="() => isRoomSettingsOpen = !isRoomSettingsOpen">roomSettings</MkButton>
			<MkButton @click="expor">Export</MkButton>
			<MkButton @click="impor">Import</MkButton>
		</div>
		<div v-if="isChanged" class="_buttons">
			保存していない変更があります
			<MkButton danger @click="revert">戻す</MkButton>
			<MkButton primary @click="save">保存</MkButton>
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
import { RoomController } from '@/world/room/controller.js';
import { cm } from '@/world/utility.js';
import { deepClone } from '@/utility/clone.js';

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
const isRoomSettingsOpen = ref(false);
const isChanged = ref(false);

const data = localStorage.getItem('roomData') != null ? JSON.parse(localStorage.getItem('roomData')!) : {
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

console.log(data);

let latestData = deepClone(data);

const controller = new RoomController(data);

onMounted(async () => {
	controller.init(canvas.value!);

	canvas.value!.focus();

	window.addEventListener('resize', resize);

	watch(controller.roomState, () => {
		isChanged.value = true;
	});

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

function cancelGrabbing() {
	controller.cancelGrabbing();
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
		active: computed(() => controller.gridSnapping.value.scale === cm(1)),
		action: () => controller.setGridSnapping({ ...controller.gridSnapping.value, scale: cm(1) }),
	}, {
		type: 'radioOption',
		text: '2cm',
		active: computed(() => controller.gridSnapping.value.scale === cm(2)),
		action: () => controller.setGridSnapping({ ...controller.gridSnapping.value, scale: cm(2) }),
	}, {
		type: 'radioOption',
		text: '4cm',
		active: computed(() => controller.gridSnapping.value.scale === cm(4)),
		action: () => controller.setGridSnapping({ ...controller.gridSnapping.value, scale: cm(4) }),
	}, {
		type: 'radioOption',
		text: '8cm',
		active: computed(() => controller.gridSnapping.value.scale === cm(8)),
		action: () => controller.setGridSnapping({ ...controller.gridSnapping.value, scale: cm(8) }),
	}], ev.currentTarget ?? ev.target);
}

function rotate() {
	controller.changeGrabbingRotationY(Math.PI / 8);
	canvas.value!.focus();
}

async function addObject(ev: PointerEvent) {
	// 重いので止める
	controller.pauseRender();
	const { dispose } = await os.popupAsyncWithDialog(import('./room.add-object-dialog.vue').then(x => x.default), {
	}, {
		ok: async (res) => {
			controller.addObject(res);
			canvas.value!.focus();
		},
		closed: () => {
			controller.resumeRender();
			dispose();
		},
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
	latestData = deepClone(controller.roomState.value);
	localStorage.setItem('roomData', JSON.stringify(latestData));
	isChanged.value = false;
}

async function revert() {
	await controller.reset(latestData);
	isChanged.value = false;
}

function expor() {
	const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(controller.roomState.value));
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

	&:focus {
		outline: none;
	}
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
