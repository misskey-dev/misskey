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
				<MkProgressBar :class="$style.progressBar" :progress="controller.initializeProgress.value" :waiting="controller.initializeProgress.value === 1"/>
			</div>
		</Transition>

		<div :class="$style.overlayBottom">
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

			<div v-if="useVirtualJoystick" :class="$style.joySticks">
				<div ref="joyStickLeftEl" :class="$style.joyStickLeft" :style="{ '--startXPx': (joyStickLeftStartPos?.x ?? 0) + 'px', '--startYPx': (joyStickLeftStartPos?.y ?? 0) + 'px', '--rPx': joyStickRadiusPx + 'px' }">
					<div v-show="joyStickLeftStartPos != null" :class="$style.joyStickRangeCircle"></div>
					<div v-show="joyStickLeftVec.x !== 0 || joyStickLeftVec.y !== 0" :class="$style.joyStickPuck" :style="{ '--x': joyStickLeftVec.x, '--y': joyStickLeftVec.y }"></div>
				</div>
				<div ref="joyStickRightEl" :class="$style.joyStickRight" :style="{ '--startXPx': (joyStickRightStartPos?.x ?? 0) + 'px', '--startYPx': (joyStickRightStartPos?.y ?? 0) + 'px', '--rPx': joyStickRadiusPx + 'px' }">
					<div v-show="joyStickRightStartPos != null" :class="$style.joyStickRangeCircle"></div>
					<div v-show="joyStickRightVec.x !== 0 || joyStickRightVec.y !== 0" :class="$style.joyStickPuck" :style="{ '--x': joyStickRightVec.x, '--y': joyStickRightVec.y }"></div>
				</div>
			</div>
		</div>

		<template v-if="!isZenMode">
			<div v-if="controller.isReady.value && controller.isEditMode.value && controller.selected.value != null && !controller.grabbing.value" :key="controller.selected.value.objectId" class="_panel" :class="$style.overlayObjectInfoPanel">
				{{ controller.selected.value.objectDef.name }}

				<XObjectCustomizeForm :schema="controller.selected.value.objectDef.options.schema" :options="controller.selected.value.objectState.options" @update="(k, v) => controller.updateObjectOption(controller.selected.value.objectId, k, v)"></XObjectCustomizeForm>
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
							<div>Wall N</div>
							<MkSelect
								:items="[
									{ label: 'None', value: null },
									{ label: 'Wood', value: 'wood' },
									{ label: 'Concrete', value: 'concrete' },
								]" :modelValue="controller.roomState.value.heya.options.wallN.material" @update:modelValue="v => { controller.updateHeyaOptions({ ...controller.roomState.value.heya.options, wallN: { ...controller.roomState.value.heya.options.wallN, material: v } }); }"
							>
								<template #label>wallpaper</template>
							</MkSelect>
							<MkInput :modelValue="getHex(controller.roomState.value.heya.options.wallN.color)" type="color" @update:modelValue="v => { const c = getRgb(v); if (c != null) controller.updateHeyaOptions({ ...controller.roomState.value.heya.options, wallN: { ...controller.roomState.value.heya.options.wallN, color: c } }); }">
								<template #label>color</template>
							</MkInput>
						</div>
						<div>
							<div>Wall E</div>
							<MkSelect
								:items="[
									{ label: 'None', value: null },
									{ label: 'Wood', value: 'wood' },
									{ label: 'Concrete', value: 'concrete' },
								]" :modelValue="controller.roomState.value.heya.options.wallE.material" @update:modelValue="v => { controller.updateHeyaOptions({ ...controller.roomState.value.heya.options, wallE: { ...controller.roomState.value.heya.options.wallE, material: v } }); }"
							>
								<template #label>wallpaper</template>
							</MkSelect>
							<MkInput :modelValue="getHex(controller.roomState.value.heya.options.wallE.color)" type="color" @update:modelValue="v => { const c = getRgb(v); if (c != null) controller.updateHeyaOptions({ ...controller.roomState.value.heya.options, wallE: { ...controller.roomState.value.heya.options.wallE, color: c } }); }">
								<template #label>color</template>
							</MkInput>
						</div>
						<div>
							<div>Wall S</div>
							<MkSelect
								:items="[
									{ label: 'None', value: null },
									{ label: 'Wood', value: 'wood' },
									{ label: 'Concrete', value: 'concrete' },
								]" :modelValue="controller.roomState.value.heya.options.wallS.material" @update:modelValue="v => { controller.updateHeyaOptions({ ...controller.roomState.value.heya.options, wallS: { ...controller.roomState.value.heya.options.wallS, material: v } }); }"
							>
								<template #label>wallpaper</template>
							</MkSelect>
							<MkInput :modelValue="getHex(controller.roomState.value.heya.options.wallS.color)" type="color" @update:modelValue="v => { const c = getRgb(v); if (c != null) controller.updateHeyaOptions({ ...controller.roomState.value.heya.options, wallS: { ...controller.roomState.value.heya.options.wallS, color: c } }); }">
								<template #label>color</template>
							</MkInput>
						</div>
						<div>
							<div>Wall W</div>
							<MkSelect
								:items="[
									{ label: 'None', value: null },
									{ label: 'Wood', value: 'wood' },
									{ label: 'Concrete', value: 'concrete' },
								]" :modelValue="controller.roomState.value.heya.options.wallW.material" @update:modelValue="v => { controller.updateHeyaOptions({ ...controller.roomState.value.heya.options, wallW: { ...controller.roomState.value.heya.options.wallW, material: v } }); }"
							>
								<template #label>wallpaper</template>
							</MkSelect>
							<MkInput :modelValue="getHex(controller.roomState.value.heya.options.wallW.color)" type="color" @update:modelValue="v => { const c = getRgb(v); if (c != null) controller.updateHeyaOptions({ ...controller.roomState.value.heya.options, wallW: { ...controller.roomState.value.heya.options.wallW, color: c } }); }">
								<template #label>color</template>
							</MkInput>
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
		<MkSelect
			:modelValue="graphicsQuality" :items="[
				{ label: 'High', value: GRAPHICS_QUALITY_HIGH },
				{ label: 'Medium', value: GRAPHICS_QUALITY_MEDIUM },
				{ label: 'Low', value: GRAPHICS_QUALITY_LOW },
			]" @update:modelValue="v => graphicsQuality = v"
		>
			<template #label>Graphics quality</template>
		</MkSelect>
		<MkButton danger @click="reload">reload</MkButton>
	</template>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import XObjectCustomizeForm from './room.object-customize-form.vue';
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
import { cm, getHex, getRgb } from '@/world/utility.js';
import { deepClone } from '@/utility/clone.js';
import { GRAPHICS_QUALITY_HIGH, GRAPHICS_QUALITY_LOW, GRAPHICS_QUALITY_MEDIUM } from '@/world/room/engine.js';
import { deviceKind } from '@/utility/device-kind.js';
import MkProgressBar from '@/components/MkProgressBar.vue';
import { Joystick } from '@/world/joystick.js';
import { isTouchUsing } from '@/utility/touch.js';

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
const graphicsQuality = ref<number>(deviceKind === 'smartphone' ? GRAPHICS_QUALITY_LOW : GRAPHICS_QUALITY_MEDIUM);
const useVirtualJoystick = isTouchUsing && (deviceKind === 'smartphone' || deviceKind === 'tablet');

const joyStickRadiusPx = 100;
const joyStickLeftEl = useTemplateRef('joyStickLeftEl');
const joyStickRightEl = useTemplateRef('joyStickRightEl');
const joyStickLeftVec = ref({ x: 0, y: 0 });
const joyStickRightVec = ref({ x: 0, y: 0 });
const joyStickLeftStartPos = ref<{ x: number; y: number } | null>(null);
const joyStickRightStartPos = ref<{ x: number; y: number } | null>(null);

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

let latestData = deepClone(data);

const controller = new RoomController(data, {
	graphicsQuality: graphicsQuality.value,
	useVirtualJoystick,
});

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

	if (joyStickLeftEl.value != null && joyStickRightEl.value != null) {
		const joyStickLeft = new Joystick(joyStickLeftEl.value!, { radiusPx: joyStickRadiusPx });
		joyStickLeft.on('start', (vector) => {
			joyStickLeftStartPos.value = vector;
		});
		joyStickLeft.on('end', () => {
			joyStickLeftStartPos.value = null;
		});
		joyStickLeft.on('updateVector', (vector) => {
			joyStickLeftVec.value = vector;
			controller.setCameraJoystickMoveVector(vector);
		});

		const joyStickRight = new Joystick(joyStickRightEl.value!, { radiusPx: joyStickRadiusPx });
		joyStickRight.on('start', (vector) => {
			joyStickRightStartPos.value = vector;
		});
		joyStickRight.on('end', () => {
			joyStickRightStartPos.value = null;
		});
		joyStickRight.on('updateVector', (vector) => {
			joyStickRightVec.value = vector;
			controller.setCameraJoystickRotateVector(vector);
		});
	}
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
			controller.addObject(res.id, res.options);
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

function save() {
	latestData = deepClone(controller.roomState.value);
	localStorage.setItem('roomData', JSON.stringify(latestData));
	isChanged.value = false;
}

async function revert() {
	await controller.reset(latestData);
	isChanged.value = false;
}

async function reload() {
	await controller.reset(null, {
		graphicsQuality: graphicsQuality.value,
		useVirtualJoystick,
	});
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

.joySticks {
	display: flex;
	width: 100%;
}

.joyStickLeft, .joyStickRight {
	position: relative;
	flex: 1;
	height: 70px;
	box-sizing: border-box;
	padding: 8px;
}

.joyStickLeft::before, .joyStickRight::before {
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

.overlayBottom {
	position: absolute;
	bottom: 0;
	left: 0;
	z-index: 1;
	width: 100%;
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
