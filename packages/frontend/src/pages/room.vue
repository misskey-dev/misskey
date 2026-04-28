<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div :class="[$style.screen, { [$style.zen]: false }]">
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

		<div :class="$style.overlayTop">
			<div :class="$style.topMain">
				<div :class="$style.topMenu" class="_panel _shadow">
					<template v-if="controller.isReady.value">
						<button v-tooltip="'照明切り替え'" :class="$style.topMenuButton" class="_button" @click="toggleLight"><i class="ti ti-bulb"></i></button>
						<button v-if="controller.isEditMode.value" :class="$style.topMenuButton" class="_button" style="color: var(--MI_THEME-accent)" @click="exitEditMode"><i class="ti ti-paint"></i></button>
						<button v-if="!controller.isEditMode.value" :class="$style.topMenuButton" class="_button" @click="enterEditMode"><i class="ti ti-paint"></i></button>
						<button v-if="controller.isEditMode.value" :class="$style.topMenuButton" class="_button" @click="addObject"><i class="ti ti-plus"></i></button>
						<button v-if="controller.isEditMode.value" :class="$style.topMenuButton" class="_button" @click="showSnappingMenu"><i class="ti ti-grid-4x4"></i></button>
						<button v-if="controller.isEditMode.value && !isRoomSettingsOpen" :class="$style.topMenuButton" class="_button" @click="() => isRoomSettingsOpen = true"><i class="ti ti-home-cog"></i></button>
						<button v-if="controller.isEditMode.value && isRoomSettingsOpen" :class="$style.topMenuButton" class="_button" style="color: var(--MI_THEME-accent)" @click="() => isRoomSettingsOpen = false"><i class="ti ti-home-cog"></i></button>
					</template>
					<button :class="$style.topMenuButton" class="_button" @click="showOtherMenu"><i class="ti ti-dots"></i></button>
				</div>
				<div v-if="isModified" :class="$style.modified" class="_panel _shadow">
					<span :class="$style.modifiedText">{{ i18n.ts._room.thereAreUnsavedChanges }}</span>
					<button class="_button" style="color: var(--MI_THEME-error)" @click="revert">戻す</button>
					<button class="_button" style="color: var(--MI_THEME-accent)" @click="save">保存</button>
				</div>
			</div>
		</div>

		<div :class="$style.overlayBottom">
			<div v-if="controller.isReady.value" class="_buttonsCenter" :class="$style.overlayControls">
				<template v-if="controller.isEditMode.value">
					<MkButton v-if="controller.grabbing.value" @click="cancelGrabbing"><i class="ti ti-x"></i> cancel</MkButton>
					<MkButton v-if="controller.grabbing.value && !controller.grabbing.value.forInstall" @click="endGrabbing"><i class="ti ti-check"></i> (E)</MkButton>
					<MkButton v-else-if="controller.grabbing.value && controller.grabbing.value.forInstall" @click="endGrabbing"><i class="ti ti-check"></i> (E)</MkButton>
					<MkButton v-else-if="controller.selected.value != null" @click="beginSelectedInstalledObjectGrabbing"><i class="ti ti-hand-grab"></i> (E)</MkButton>

					<MkButton v-if="controller.grabbing.value" @click="rotate"><i class="ti ti-view-360-arrow"></i> (R)</MkButton>

					<MkButton v-if="!controller.grabbing.value && controller.selected.value != null" @click="removeSelectedObject"><i class="ti ti-trash"></i> (X)</MkButton>
				</template>
				<MkButton v-if="controller.isSitting.value" @click="controller.standUp()">降りる (Q)</MkButton>
				<template v-for="interaction in interacions" :key="interaction.id">
					<MkButton inline @click="interaction.fn()">{{ interaction.label }}{{ interaction.isPrimary ? ' (E)' : '' }}</MkButton>
				</template>
			</div>

			<div v-if="useVirtualJoystick" ref="joyStickEl" :class="$style.joyStick" :style="{ '--startXPx': (joyStickStartPos?.x ?? 0) + 'px', '--startYPx': (joyStickStartPos?.y ?? 0) + 'px', '--rPx': joyStickRadiusPx + 'px' }">
				<div v-show="joyStickStartPos != null" :class="$style.joyStickRangeCircle"></div>
				<div v-show="joyStickVec.x !== 0 || joyStickVec.y !== 0" :class="$style.joyStickPuck" :style="{ '--x': joyStickVec.x, '--y': joyStickVec.y }"></div>
			</div>
		</div>

		<div v-if="controller.isReady.value && controller.isEditMode.value && controller.selected.value != null && !controller.grabbing.value" :key="controller.selected.value.objectId" class="_panel" :class="$style.overlayObjectInfoPanel">
			{{ controller.selected.value.objectDef.name }}

			<XObjectCustomizeForm :schema="controller.selected.value.objectDef.options.schema" :options="controller.selected.value.objectState.options" @update="(k, v) => controller.updateObjectOption(controller.selected.value.objectId, k, v)"></XObjectCustomizeForm>
		</div>

		<div v-if="isRoomSettingsOpen && controller.isEditMode.value" class="_panel" :class="$style.overlayObjectInfoPanel">
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
	</div>

	<div v-if="controller.isReady.value" class="_buttons" :class="$style.controls">
		<!--<MkButton v-for="action in actions" :key="action.key" @click="action.fn">{{ action.label }}{{ hotkeyToLabel(action.hotkey) }}</MkButton>-->
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import * as BABYLON from '@babylonjs/core';
import XObjectCustomizeForm from './room.object-customize-form.vue';
import type { RoomControllerOptions } from '@/world/room/controller.js';
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
import { prefer } from '@/preferences.js';

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

const isRoomSettingsOpen = ref(false);
const isModified = ref(false);

const graphicsQualityRaw = prefer.model('world.graphicsQuality');
const graphicsQualityAutoValue = computed<number>(() => deviceKind !== 'desktop' ? GRAPHICS_QUALITY_LOW : GRAPHICS_QUALITY_MEDIUM);
const graphicsQuality = computed<number>(() => graphicsQualityRaw.value ?? graphicsQualityAutoValue.value);

const fpsRaw = prefer.model('world.fps');
const fpsAutoValue = computed<number | null>(() => deviceKind !== 'desktop' ? 30 : 60);
const fps = computed<number | null>(() =>
	fpsRaw.value == null ? fpsAutoValue.value :
	fpsRaw.value === 'max' ? null :
	fpsRaw.value === '120' ? 120 :
	fpsRaw.value === '60' ? 60 :
	30);

const resolutionRaw = prefer.model('world.resolution');
const resolutionAutoValue = computed<number>(() => deviceKind !== 'desktop' ? 0.5 : 1);
const resolution = computed<number>(() => resolutionRaw.value ?? resolutionAutoValue.value);

//const useVirtualJoystick = isTouchUsing && (deviceKind === 'smartphone' || deviceKind === 'tablet');
const useVirtualJoystick = true;

const wasdVec = { x: 0, y: 0 };
const pointerVec = { x: 0, y: 0 };
let isDashing = false;

const joyStickRadiusPx = 100;
const joyStickEl = useTemplateRef('joyStickEl');
const joyStickVec = ref({ x: 0, y: 0 });
const joyStickStartPos = ref<{ x: number; y: number } | null>(null);

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

const roomControllerOptions = computed<RoomControllerOptions>(() => ({
	graphicsQuality: graphicsQuality.value,
	fps: fps.value,
	resolution: resolution.value,
	useVirtualJoystick,
	workerMode: true,
}));

const controller = new RoomController(data, roomControllerOptions.value);

onMounted(async () => {
	if (!await BABYLON.WebGPUEngine.IsSupportedAsync) {
		os.alert({
			type: 'warning',
			title: i18n.ts._room.yourDeviceNotSupported_title,
			text: i18n.ts._room.yourDeviceNotSupported_description,
		});
		return;
	}

	try {
		await controller.init(canvas.value!);
	} catch (err) {
		os.alert({
			type: 'error',
			title: i18n.ts._room.failedToInitialize,
			text: (err instanceof Error ? err.message : String(err)),
		});
		return;
	}

	canvas.value!.focus();

	window.addEventListener('resize', resize);

	watch(controller.roomState, () => {
		isModified.value = true;
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

	if (joyStickEl.value != null) {
		const joyStick = new Joystick(joyStickEl.value!, { radiusPx: joyStickRadiusPx });
		joyStick.on('start', (vector) => {
			joyStickStartPos.value = vector;
		});
		joyStick.on('end', () => {
			joyStickStartPos.value = null;
		});
		joyStick.on('updateVector', (vector) => {
			joyStickVec.value = vector;
			controller.setCameraJoystickMoveVector(vector);
		});
	}

	canvas.value!.addEventListener('keydown', (ev) => {
		if (ev.repeat) return;

		switch (ev.code) {
			case 'KeyW':
				wasdVec.y = -1;
				controller.setCameraMoveVector(wasdVec, isDashing);
				break;
			case 'KeyS':
				wasdVec.y = 1;
				controller.setCameraMoveVector(wasdVec, isDashing);
				break;
			case 'KeyA':
				wasdVec.x = -1;
				controller.setCameraMoveVector(wasdVec, isDashing);
				break;
			case 'KeyD':
				wasdVec.x = 1;
				controller.setCameraMoveVector(wasdVec, isDashing);
				break;
			case 'ShiftLeft':
			case 'ShiftRight':
				isDashing = true;
				controller.setCameraMoveVector(wasdVec, isDashing);
				break;
		}
	});

	canvas.value!.addEventListener('keyup', (ev) => {
		switch (ev.code) {
			case 'KeyW':
				wasdVec.y = 0;
				controller.setCameraMoveVector(wasdVec, isDashing);
				break;
			case 'KeyS':
				wasdVec.y = 0;
				controller.setCameraMoveVector(wasdVec, isDashing);
				break;
			case 'KeyA':
				wasdVec.x = 0;
				controller.setCameraMoveVector(wasdVec, isDashing);
				break;
			case 'KeyD':
				wasdVec.x = 0;
				controller.setCameraMoveVector(wasdVec, isDashing);
				break;
			case 'ShiftLeft':
			case 'ShiftRight':
				isDashing = false;
				controller.setCameraMoveVector(wasdVec, isDashing);
				break;
		}
	});

	canvas.value!.addEventListener('pointerdown', (ev) => {
		pointerVec.x = ev.clientX;
		pointerVec.y = ev.clientY;

		let timeoutId: number | null = null;

		const onMove = (ev: PointerEvent) => {
			if (timeoutId != null) {
				window.clearTimeout(timeoutId);
				timeoutId = null;
			}

			const before = pointerVec;
			const after = { x: ev.clientX, y: ev.clientY };

			controller.setCameraRotateVector({
				x: after.x - before.x,
				y: after.y - before.y,
			});

			pointerVec.x = after.x;
			pointerVec.y = after.y;

			timeoutId = window.setTimeout(() => {
				timeoutId = null;

				controller.setCameraRotateVector({
					x: 0,
					y: 0,
				});
			}, 10);
		};

		canvas.value!.addEventListener('pointermove', onMove);

		canvas.value!.addEventListener('pointerup', (ev) => {
			canvas.value!.removeEventListener('pointermove', onMove);

			pointerVec.x = 0;
			pointerVec.y = 0;

			controller.setCameraRotateVector(pointerVec);
		});
	});

	watch([graphicsQuality, fps, resolution], () => {
		refresh();
	});
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
	isModified.value = false;
}

async function revert() {
	const { canceled } = await os.confirm({
		type: 'warning',
		title: i18n.ts.areYouSure,
		text: i18n.ts._room.revertAllChangesConfirmation,
	});
	if (canceled) return;

	await controller.reset(latestData);
	isModified.value = false;
}

async function refresh() {
	await controller.reset(null, roomControllerOptions.value);
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

function showOtherMenu(ev: PointerEvent) {
	os.popupMenu([{
		type: 'radio',
		text: i18n.ts._room.graphicsQuality,
		caption: graphicsQualityRaw.value == null ? i18n.ts.auto : graphicsQualityRaw.value === GRAPHICS_QUALITY_HIGH ? 'High' : graphicsQualityRaw.value === GRAPHICS_QUALITY_MEDIUM ? 'Medium' : 'Low',
		options: [{
			label: `${i18n.ts.auto} (${graphicsQualityAutoValue.value === GRAPHICS_QUALITY_HIGH ? 'High' : graphicsQualityAutoValue.value === GRAPHICS_QUALITY_MEDIUM ? 'Medium' : 'Low'})`,
			value: null,
		}, { type: 'divider' }, {
			label: 'High',
			value: GRAPHICS_QUALITY_HIGH,
		}, {
			label: 'Medium',
			value: GRAPHICS_QUALITY_MEDIUM,
		}, {
			label: 'Low',
			value: GRAPHICS_QUALITY_LOW,
		}],
		ref: graphicsQualityRaw,
	}, {
		type: 'radio',
		text: i18n.ts._room.frameRate,
		caption: fpsRaw.value == null ? i18n.ts.auto : fpsRaw.value === 'max' ? 'Max' : `~${fpsRaw.value}fps`,
		options: [{
			label: `${i18n.ts.auto} (${fpsAutoValue.value}fps)`,
			value: null,
		}, { type: 'divider' }, {
			label: 'Max',
			value: 'max',
		}, {
			label: '~120fps',
			value: '120',
		}, {
			label: '~60fps',
			value: '60',
		}, {
			label: '~30fps',
			value: '30',
		}],
		ref: fpsRaw,
	}, {
		type: 'radio',
		text: i18n.ts._room.resolution,
		caption: resolutionRaw.value == null ? i18n.ts.auto : resolutionRaw.value + 'x',
		options: [{
			label: `${i18n.ts.auto} (${resolutionAutoValue.value}x)`,
			value: null,
		}, { type: 'divider' }, {
			label: '2x',
			value: 2,
		}, {
			label: '1x',
			value: 1,
		}, {
			label: '0.5x',
			value: 0.5,
		}],
		ref: resolutionRaw,
	}, {
		type: 'divider',
	}, {
		text: 'Export',
		action: expor,
	}, {
		text: 'Import',
		action: impor,
	}, {
		type: 'divider',
	}, {
		text: 'Refresh',
		action: refresh,
	}], ev.currentTarget ?? ev.target);
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
	overflow: clip;
	background: var(--MI_THEME-bg);
}

.screen {
	position: relative;
	width: 100%;
	height: 100cqh;
	overflow: clip;
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

.joyStick {
	position: relative;
	width: 50%;
	height: 100px;
	box-sizing: border-box;
	padding: 8px;
}

.joyStick::before {
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

.overlayTop {
	position: absolute;
	top: 0;
	left: 0;
	z-index: 1;
	width: 100%;
}

.overlayBottom {
	position: absolute;
	bottom: 0;
	left: 0;
	z-index: 1;
	width: 100%;
}

.topMain {
	display: flex;
	align-items: center;
	gap: 16px;
}

.topMenu {
	margin: 16px;
	display: flex;
	box-sizing: border-box;
	width: max-content;
}

.topMenuButton {
	padding: 8px;
}
.topMenuButton:first-child {
	padding-left: 16px;
}
.topMenuButton:last-child {
	padding-right: 16px;
}

.modified {
	display: flex;
	align-items: center;
	font-size: 90%;
	gap: 1em;
	padding: 8px 16px;
}

.modifiedText {
	color: var(--MI_THEME-warn);
	animation: modified-blink 2s infinite;
}

@keyframes modified-blink {
	0% { opacity: 1; }
	50% { opacity: 0.5; }
	100% { opacity: 1; }
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
