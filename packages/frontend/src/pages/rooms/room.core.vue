<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.screen, { [$style.zen]: false }]">
	<canvas ref="canvas" :key="canvasKey" :class="$style.canvas" tabindex="-1"></canvas>

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
			<div :class="$style.topMenu">
				<template v-if="isNarrow">
					<button v-if="isMenuShowing" v-tooltip.noDelay="i18n.ts.menu" :class="$style.floatingButton" class="_button" style="color: var(--MI_THEME-accent)" @click="isMenuShowing = false"><i class="ti ti-menu"></i></button>
					<button v-if="!isMenuShowing" v-tooltip.noDelay="i18n.ts.menu" :class="$style.floatingButton" class="_button" @click="isMenuShowing = true"><i class="ti ti-menu"></i></button>
				</template>

				<template v-if="isMenuShowing">
					<template v-if="controller.isReady.value">
						<button v-if="!controller.isEditMode.value && multiplayer.isOnline.value" v-tooltip.noDelay="i18n.ts._miWorld.onlineMenu" :class="$style.floatingButton" class="_button" style="color: var(--MI_THEME-accent)" @click="showOnlineMenu"><i class="ti ti-world"></i></button>
						<button v-if="!controller.isEditMode.value && !multiplayer.isOnline.value" v-tooltip.noDelay="i18n.ts._miWorld.onlineMenu" :class="$style.floatingButton" class="_button" @click="showOnlineMenu"><i class="ti ti-world"></i></button>

						<button v-if="!controller.isEditMode.value" v-tooltip.noDelay="i18n.ts._miWorld.character" :class="$style.floatingButton" class="_button" @click="showCharacterMenu"><i class="ti ti-man"></i></button>

						<button v-tooltip.noDelay="'照明切り替え'" :class="$style.floatingButton" class="_button" @click="toggleLight"><i class="ti ti-bulb"></i></button>

						<button v-if="!multiplayer.isOnline.value && controller.isEditMode.value" v-tooltip.noDelay="i18n.ts._miRoom.exitEditMode" :class="$style.floatingButton" class="_button" style="color: var(--MI_THEME-accent)" @click="exitEditMode"><i class="ti ti-paint"></i></button>
						<button v-if="!multiplayer.isOnline.value && !controller.isEditMode.value && isMyRoom" v-tooltip.noDelay="i18n.ts._miRoom.enterEditMode" :class="$style.floatingButton" class="_button" @click="enterEditMode"><i class="ti ti-paint"></i></button>

						<button v-if="controller.isEditMode.value" v-tooltip.noDelay="i18n.ts._miRoom.installFurniture" :class="$style.floatingButton" class="_button" @click="addFuniture"><i class="ti ti-plus"></i></button>
						<button v-if="controller.isEditMode.value" :class="$style.floatingButton" class="_button" @click="showSnappingMenu"><i class="ti ti-grid-4x4"></i></button>
						<button v-if="controller.isEditMode.value && !isRoomSettingsOpen" v-tooltip.noDelay="i18n.ts._miRoom.roomCustomize" :class="$style.floatingButton" class="_button" @click="() => isRoomSettingsOpen = true"><i class="ti ti-home-cog"></i></button>
						<button v-if="controller.isEditMode.value && isRoomSettingsOpen" :class="$style.floatingButton" class="_button" style="color: var(--MI_THEME-accent)" @click="() => isRoomSettingsOpen = false"><i class="ti ti-home-cog"></i></button>

						<button v-if="!controller.isEditMode.value" v-tooltip.noDelay="i18n.ts._miWorld.takeScreenShot" :class="$style.floatingButton" class="_button" @click="takeScreenshot"><i class="ti ti-camera"></i></button>

						<button v-if="isRoomInfoOpen" v-tooltip.noDelay="i18n.ts._miRoom.roomInfo" :class="$style.floatingButton" class="_button" style="color: var(--MI_THEME-accent)" @click="isRoomInfoOpen = false"><i class="ti ti-info-circle"></i></button>
						<button v-if="!isRoomInfoOpen" v-tooltip.noDelay="i18n.ts._miRoom.roomInfo" :class="$style.floatingButton" class="_button" @click="isRoomInfoOpen = true"><i class="ti ti-info-circle"></i></button>
					</template>
					<button v-tooltip.noDelay="i18n.ts.other" :class="$style.floatingButton" class="_button" @click="showOtherMenu"><i class="ti ti-dots"></i></button>
				</template>
			</div>
			<div v-if="isModified" :class="$style.modified" class="_panel _shadow">
				<span :class="$style.modifiedText">{{ i18n.ts._miRoom.thereAreUnsavedChanges }}</span>
				<button class="_button" style="color: var(--MI_THEME-error)" @click="revert">戻す</button>
				<button class="_button" style="color: var(--MI_THEME-accent)" @click="save">保存</button>
			</div>
		</div>
	</div>

	<div :class="$style.overlayBottom">
		<div v-if="controller.isReady.value" :class="$style.overlayControls">
			<template v-if="controller.isEditMode.value">
				<template v-if="controller.selected.value != null && controller.grabbing.value == null">
					<button v-if="isFurnitureSettingsOpen" v-tooltip.noDelay="i18n.ts._miRoom.furnitureCustomize" class="_button" :class="$style.floatingButton" style="color: var(--MI_THEME-accent)" @click="isFurnitureSettingsOpen = false"><i class="ti ti-tool"></i></button>
					<button v-if="!isFurnitureSettingsOpen" v-tooltip.noDelay="i18n.ts._miRoom.furnitureCustomize" class="_button" :class="$style.floatingButton" @click="isFurnitureSettingsOpen = true"><i class="ti ti-tool"></i></button>
				</template>

				<button v-if="controller.grabbing.value" v-tooltip.noDelay="'Cancel (Q)'" class="_button" :class="$style.floatingButton" @click="cancelGrabbing"><i class="ti ti-x"></i></button>
				<button v-if="controller.grabbing.value && !controller.grabbing.value.forInstall" v-tooltip.noDelay="'Put (E)'" class="_button" :class="$style.floatingButton" style="color: var(--MI_THEME-accent)" @click="endGrabbing"><i class="ti ti-check"></i></button>
				<button v-else-if="controller.grabbing.value && controller.grabbing.value.forInstall" v-tooltip.noDelay="'Put (E)'" class="_button" :class="$style.floatingButton" style="color: var(--MI_THEME-accent)" @click="endGrabbing"><i class="ti ti-check"></i></button>
				<button v-else-if="controller.selected.value != null" v-tooltip.noDelay="i18n.ts._miRoom.grab + ' (E)'" class="_button" :class="$style.floatingButton" @click="beginSelectedInstalledFunitureGrabbing"><i class="ti ti-hand-grab"></i></button>

				<button v-if="controller.grabbing.value" class="_button" :class="$style.floatingButton" @click="controller.changeGrabbingRotation(Math.PI / 8)"><i class="ti ti-rotate-clockwise"></i></button>
				<button v-if="controller.grabbing.value" class="_button" :class="$style.floatingButton" @click="controller.changeGrabbingRotation(-Math.PI / 8)"><i class="ti ti-rotate"></i></button>
				<button v-if="controller.grabbing.value" class="_button" :class="$style.floatingButton" @click="controller.changeGrabbingDistance(10)"><i class="ti ti-arrows-maximize"></i></button>
				<button v-if="controller.grabbing.value" class="_button" :class="$style.floatingButton" @click="controller.changeGrabbingDistance(-10)"><i class="ti ti-arrows-minimize"></i></button>

				<button v-if="!controller.grabbing.value && controller.selected.value != null" v-tooltip.noDelay="i18n.ts._miRoom.duplicate" class="_button" :class="$style.floatingButton" @click="duplicateSelectedFuniture"><i class="ti ti-copy"></i></button>
				<button v-if="!controller.grabbing.value && controller.selected.value != null" v-tooltip.noDelay="i18n.ts._miRoom.uninstallFurniture" class="_button" :class="$style.floatingButton" style="color: var(--MI_THEME-error)" @click="removeSelectedFuniture"><i class="ti ti-trash"></i></button>
			</template>
			<template v-else>
				<MkButton v-if="controller.isSitting.value" @click="controller.standUp()">降りる (Q)</MkButton>
				<template v-if="controller.selected.value != null">
					<template v-for="interaction in controller.selected.value.interacions" :key="interaction.id">
						<MkButton inline @click="controller.interact(interaction.id)">{{ interaction.label }}{{ interaction.isPrimary ? ' (E)' : '' }}</MkButton>
					</template>
				</template>
			</template>
		</div>

		<MkVirtualJoystick v-if="useVirtualJoystick && controller.isReady.value" :class="$style.joystick" @update="v => controller.setCameraJoystickMoveVector(v)"/>
	</div>

	<XOverlayPanel v-if="controller.isReady.value && controller.isEditMode.value && controller.selected.value != null && isFurnitureSettingsOpen" :key="controller.selected.value.furnitureId" :isNarrow="isNarrow" :title="FURNITURE_UI_DEFS[controller.selected.value.funitureState.type].name" @close="isFurnitureSettingsOpen = false">
		<template #icon>
			<i class="ti ti-box"></i>
		</template>

		<MkWorldMonoOptionsForm
			:uiDef="FURNITURE_UI_DEFS[FURNITURE_SCHEMA_DEFS[controller.selected.value.funitureState.type].id]"
			:addFileAttachment="addFileAttachment"
			:schema="FURNITURE_SCHEMA_DEFS[controller.selected.value.funitureState.type].options.schema"
			:options="controller.selected.value.funitureState.options"
			@update="(k, v) => updateFurnitureOption(k, v)"
		/>
	</XOverlayPanel>

	<XOverlayPanel v-if="isRoomSettingsOpen && controller.isEditMode.value" :isNarrow="isNarrow" :title="i18n.ts._miRoom.roomCustomize" @close="isRoomSettingsOpen = false">
		<template #icon>
			<i class="ti ti-home-cog"></i>
		</template>

		<XEnvOptions :controller="controller" @changeEnvType="changeEnvType"/>
	</XOverlayPanel>

	<XOverlayPanel v-if="isRoomInfoOpen" :isNarrow="isNarrow" :title="room.name" @close="isRoomInfoOpen = false">
		<template #icon>
			<i class="ti ti-info-circle"></i>
		</template>

		<div class="_gaps_s">
			<MkButton v-if="isMyRoom" @click="changeRoomName">{{ i18n.ts._miRoom.changeRoomName }}</MkButton>

			<div v-if="room.description">
				<Mfm :text="room.description" :isNote="false"/>
			</div>
			<div v-else style="opacity: 0.5;">{{ i18n.ts.noDescription }}</div>

			<MkA :to="`${userPage(room.user)}`" :behavior="'window'">
				<MkUserCardMini :user="room.user" :withChart="false"/>
			</MkA>

			<hr>

			<div>{{ i18n.ts._miRoom.furnituresCount }}: {{ controller.roomState.value.installedFurnitures.length }}</div>
			<div>{{ i18n.ts._miRoom.attachedFilesCount }}: {{ attachments.files.length }}</div>
		</div>
	</XOverlayPanel>

	<XOverlayPanel v-if="isPlayerInfoOpen && pointedPlayerInfo != null" :isNarrow="isNarrow" :title="pointedPlayerInfo.user != null ? (pointedPlayerInfo.user?.name ?? pointedPlayerInfo.user?.username) : '(anonymous)'" @close="isPlayerInfoOpen = false">
		<template #icon>
			<i class="ti ti-user"></i>
		</template>

		<div v-if="pointedPlayerInfo.user != null">
			<MkA :to="`/@${pointedPlayerInfo.user.username}`" :behavior="'window'">
				<img v-if="pointedPlayerInfo.user.avatarUrl" :class="$style.pointedPlayerInfoAvatar" :src="pointedPlayerInfo.user.avatarUrl" decoding="async"/>
				<span>@{{ pointedPlayerInfo.user.username }}</span>
			</MkA>
		</div>
		<div v-else>anonymous</div>
	</XOverlayPanel>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, markRaw, nextTick, onActivated, onDeactivated, onMounted, onUnmounted, ref, shallowRef, triggerRef, useTemplateRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { cm, getHex, getRgb, WORLD_SCALE } from 'misskey-world/src/utility.js';
import { GRAPHICS_QUALITY } from 'misskey-world-engine/src/utility.js';
import { FURNITURE_SCHEMA_DEFS } from 'misskey-world/src/room/furniture-schema-defs.js';
import { useInterval } from '@@/js/use-interval.js';
import { url } from '@@/js/config.js';
import XEnvOptions from './room.env-options.vue';
import XOverlayPanel from './OverlayPanel.vue';
import type { RoomControllerOptions } from '@/world/room/controller.js';
import type { RoomState, RoomAttachments } from 'misskey-world/src/room/type.js';
import type { PlayerProfile } from 'misskey-world-engine/src/PlayerContainer.js';
import MkWorldMonoOptionsForm from '@/components/MkWorldMonoOptionsForm.vue';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { RoomController } from '@/world/room/controller.js';
import { deepClone } from '@/utility/clone.js';
import { deviceKind } from '@/utility/device-kind.js';
import MkProgressBar from '@/components/MkProgressBar.vue';
import { isTouchUsing } from '@/utility/touch.js';
import { prefer } from '@/preferences.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { miLocalStorage } from '@/local-storage.js';
import { FURNITURE_UI_DEFS } from '@/world/room/furniture-ui-defs.js';
import { Multiplayer } from '@/world/room/multiplayer.js';
import { $i } from '@/i.js';
import { userPage } from '@/filters/user.js';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import MkVirtualJoystick from '@/components/MkVirtualJoystick.vue';

const roomSpecVersion = 0;

const props = defineProps<{
	room: Misskey.entities.WorldRoomDetailed;
}>();

const canvasKey = ref(0); // 一度ワーカーに渡したcanvasは再利用できないため作り直すためのkey
const canvas = useTemplateRef('canvas');

const isMyRoom = computed(() => props.room.userId === $i?.id);
const isNarrow = deviceKind === 'smartphone';
const isModified = ref(false);
const pointedPlayerInfo = ref<PlayerProfile | null>(null);

const isMenuShowing = ref(!isNarrow);
const isRoomSettingsOpen = ref(false);
const isRoomInfoOpen = ref(false);
const isFurnitureSettingsOpen = ref(false);
const isPlayerInfoOpen = ref(false);

watch(isFurnitureSettingsOpen, () => {
	if (isFurnitureSettingsOpen.value) {
		isRoomSettingsOpen.value = false;
		isRoomInfoOpen.value = false;
	}
});

const graphicsQualityRaw = prefer.model('world.graphicsQuality');
const graphicsQualityAutoValue = computed<number>(() => deviceKind !== 'desktop' ? GRAPHICS_QUALITY.LOW : GRAPHICS_QUALITY.MEDIUM);
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

const antialias = prefer.model('world.antialias');

const useVirtualJoystick = isTouchUsing && (deviceKind === 'smartphone' || deviceKind === 'tablet');
//const useVirtualJoystick = true;

let latestSavedRoomState = deepClone(props.room.def) as unknown as RoomState;
let initialRoomState = latestSavedRoomState;

// 後方互換性のため
if (initialRoomState.installedObjects != null) {
	initialRoomState.installedFurnitures = initialRoomState.installedObjects;
	delete initialRoomState.installedObjects;
}
for (const obj of initialRoomState.installedFurnitures) {
	if (obj.options.customPicture != null) {
		obj.options.image = {
			type: null,
		};
		delete obj.options.customPicture;
	}
	if (obj.type === 'ironFrameShelf5') {
		obj.type = 'ironFrameShelf';
	} else if (obj.type === 'ironFrameShelf4') {
		obj.type = 'ironFrameShelf';
	} else if (obj.type === 'ironFrameShelf3') {
		obj.type = 'ironFrameShelf';
	}
}

let latestSavedAttachments = {
	files: deepClone(props.room.attachedFiles),
} as RoomAttachments;

let attachments = deepClone(latestSavedAttachments);

type RoomTemp = {
	date: number;
	roomState: RoomState;
	attachments: RoomAttachments;
};

const cachedUnsavedTempDataStr = miLocalStorage.getItem(`miWorldRoomTemp:${props.room.id}`);
const cachedUnsavedTempDataParsed = cachedUnsavedTempDataStr != null ? JSON.parse(cachedUnsavedTempDataStr) as RoomTemp : null;
const cachedUnsavedTempData = cachedUnsavedTempDataParsed != null && cachedUnsavedTempDataParsed.date > new Date(props.room.updatedAt).getTime() ? cachedUnsavedTempDataParsed : null;
if (cachedUnsavedTempData != null) {
	initialRoomState = cachedUnsavedTempData.roomState;
	attachments = cachedUnsavedTempData.attachments;
	isModified.value = true;
}

function addFileAttachment(file: Misskey.entities.DriveFile) {
	// TODO: clean unused attachment
	attachments.files.push(file);
}

const roomControllerOptions = computed<RoomControllerOptions>(() => ({
	graphicsQuality: graphicsQuality.value,
	fps: fps.value,
	resolution: resolution.value,
	antialias: antialias.value,
	useVirtualJoystick,
	fov: prefer.s['world.fov'],
	workerMode: prefer.s['world.separateRenderingThread'],
}));

const controller = markRaw(new RoomController(deepClone(initialRoomState), roomControllerOptions.value));
const multiplayer = markRaw(new Multiplayer(props.room.id, controller));

watch(controller.roomState, () => {
	controller.roomState.value.worldScale = WORLD_SCALE;
	miLocalStorage.setItem(`miWorldRoomTemp:${props.room.id}`, JSON.stringify({
		date: Date.now(),
		roomState: controller.roomState.value,
		attachments,
	} as RoomTemp));
	isModified.value = true;
});

watch(controller.selected, () => {
	if (controller.selected.value != null) {
		if (!isNarrow) {
			isFurnitureSettingsOpen.value = true;
		}
	}
});

watch(controller.grabbing, () => {
	if (controller.grabbing.value != null) {
		isFurnitureSettingsOpen.value = false;
	}
});

watch([graphicsQuality, fps, resolution, antialias], () => {
	refresh();
});

controller.addListener('playerPointed', ({ playerId }) => {
	pointedPlayerInfo.value = multiplayer.playerProfiles[playerId] ?? null;
	isPlayerInfoOpen.value = true;
});

function resize() {
	controller.resize();
}

onMounted(async () => {
	// TODO: babylonに依存しないで判定する
	//if (!await BABYLON.WebGPUEngine.IsSupportedAsync) {
	//	os.alert({
	//		type: 'warning',
	//		title: i18n.ts._miRoom.yourDeviceNotSupported_title,
	//		text: i18n.ts._miRoom.yourDeviceNotSupported_description,
	//	});
	//	return;
	//}

	try {
		await controller.init(canvas.value!, attachments);
	} catch (err) {
		console.error(err);
		os.alert({
			type: 'error',
			title: i18n.ts._miWorld.failedToInitialize,
			text: (err instanceof Error ? err.message : String(err)),
		});
		return;
	}

	canvas.value!.focus();

	window.addEventListener('resize', resize);

	// canvasからフォーカスが外れていることに気づかずsとか押してしまうと検索画面が開かれてroomの状態が失われたりするので無効化
	(window as any).disableGlobalHotkeys();
});

useInterval(() => {
	multiplayer.updateState(controller.myPlayerState.value);
}, 100, { immediate: false, afterMounted: true });

onDeactivated(() => {
	controller.destroy();
	multiplayer.dispose();

	window.removeEventListener('resize', resize);
});

onActivated(() => {
	// controller.resetする？
});

onUnmounted(() => {
	controller.destroy();
	multiplayer.dispose();

	window.removeEventListener('resize', resize);
});

function beginSelectedInstalledFunitureGrabbing() {
	controller.beginSelectedInstalledFunitureGrabbing();
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
		text: i18n.ts._miRoom.snapToGrid,
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
	}, {
		type: 'radioOption',
		text: '16cm',
		active: computed(() => controller.gridSnapping.value.scale === cm(16)),
		action: () => controller.setGridSnapping({ ...controller.gridSnapping.value, scale: cm(16) }),
	}], ev.currentTarget ?? ev.target);
}

function updateFurnitureOption(k: string, v: any) {
	// TODO: podtMrssageのコスト削減のためattachmentsは更新がある場合のみ送る
	controller.updateFurnitureOption(controller.selected.value.furnitureId, k, deepClone(v), attachments);
}

async function addFuniture(ev: PointerEvent) {
	// 重いので止める
	controller.pauseRender();
	const { dispose } = await os.popupAsyncWithDialog(import('./room.add-furniture-dialog.vue').then(x => x.default), {
		graphicsQuality: graphicsQuality.value,
	}, {
		ok: async (res) => {
			attachments.files.push(...res.attachments.files); // TODO: mergeAttachmentsみたいな関数を実装して使う
			controller.addFuniture(res.id, res.options, attachments);
			canvas.value!.focus();
		},
		closed: () => {
			controller.resumeRender();
			dispose();
		},
	});
}

function changeEnvType(type: RoomState['env']['type']) {
	controller.roomState.value.env.type = type;
	triggerRef(controller.roomState);
	refresh();
}

function duplicateSelectedFuniture() {
	controller.duplicateSelectedFuniture();
	canvas.value!.focus();
}

function removeSelectedFuniture() {
	controller.removeSelectedFuniture();
	canvas.value!.focus();
}

function enterEditMode() {
	controller.enterEditMode();
}

function exitEditMode() {
	controller.exitEditMode();
}

async function save() {
	await os.apiWithDialog('world/rooms/update', {
		roomId: props.room.id,
		def: {
			...controller.roomState.value,
			_v: roomSpecVersion,
		},
	});
	latestSavedRoomState = deepClone(controller.roomState.value);
	latestSavedAttachments = deepClone(attachments);
	miLocalStorage.removeItem(`miWorldRoomTemp:${props.room.id}`);
	isModified.value = false;
}

async function revert() {
	const { canceled } = await os.confirm({
		type: 'warning',
		title: i18n.ts.areYouSure,
		text: i18n.ts._miRoom.revertAllChangesConfirmation,
	});
	if (canceled) return;

	attachments = deepClone(latestSavedAttachments);
	canvasKey.value++;
	await nextTick();
	await controller.reset(canvas.value!, attachments, deepClone(latestSavedRoomState));
	miLocalStorage.removeItem(`miWorldRoomTemp:${props.room.id}`);
	isModified.value = false;
}

async function refresh() {
	canvasKey.value++;
	await nextTick();
	await controller.reset(canvas.value!, attachments, null, roomControllerOptions.value);
}

async function takeScreenshot() {
	await controller.downloadScreenshot();
}

// TODO: ちゃんと書く
function expor() {
	const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
		attachments,
		def: controller.roomState.value,
		v: roomSpecVersion,
	}));
	const dlAnchorElem = window.document.createElement('a');
	dlAnchorElem.setAttribute('href', dataStr);
	dlAnchorElem.setAttribute('download', 'room.json');
	dlAnchorElem.click();
}

// TODO: ちゃんと書く
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
				let data = JSON.parse(reader.result as string);
				// 後方互換性のため
				if (data.attachments == null) {
					data = {
						def: data,
						attachments: { files: [] },
					};
				}
				if (data.def.worldScale == null) {
					data.def.worldScale = 1;
				}
				if (data.def.heya != null) {
					data.def.env = data.def.heya;
					delete data.def.heya;
				}
				os.apiWithDialog('world/rooms/update', {
					roomId: props.room.id,
					def: {
						...data.def,
						_v: roomSpecVersion,
					},
				}).then(() => {
					window.location.reload();
				});
			} catch (e) {
				alert('Failed to load room data: ' + e);
			}
		};
		reader.readAsText(file);
	});
	inputElem.click();
}

function showCharacterMenu(ev: PointerEvent) {
	os.popupMenu([{
		text: i18n.ts._miWorld.sit,
		action: () => {
		},
	}, {
		text: i18n.ts._miWorld.lyingDown,
		action: () => {
		},
	}], ev.currentTarget ?? ev.target);
}

function showOnlineMenu(ev: PointerEvent) {
	os.popupMenu([{
		text: multiplayer.isOnline.value ? i18n.ts._miWorld.disconnectToOnline : i18n.ts._miWorld.connectToOnline,
		danger: multiplayer.isOnline.value,
		action: () => {
			if (multiplayer.isOnline.value) {
				leaveOnline();
			} else {
				enterOnline();
			}
		},
	}], ev.currentTarget ?? ev.target);
}

function showOtherMenu(ev: PointerEvent) {
	os.popupMenu([{
		text: i18n.ts.share,
		icon: 'ti ti-share',
		action: async () => {
			os.post({
				initialText: `${props.room.name} by @${props.room.user.username}
${url}/rooms/r/${props.room.id}`,
				instant: true,
			});
		},
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
		text: 'a',
		action: expor,
	}, {
		type: 'divider',
	}, {
		type: 'parent',
		text: i18n.ts._miWorld.graphicsSettings,
		children: [{
			type: 'radio',
			text: i18n.ts._miWorld.graphicsQuality,
			caption: graphicsQualityRaw.value == null ? i18n.ts.auto : graphicsQualityRaw.value === GRAPHICS_QUALITY.HIGH ? 'High' : graphicsQualityRaw.value === GRAPHICS_QUALITY.MEDIUM ? 'Medium' : 'Low',
			options: [{
				label: `${i18n.ts.auto} (${graphicsQualityAutoValue.value === GRAPHICS_QUALITY.HIGH ? 'High' : graphicsQualityAutoValue.value === GRAPHICS_QUALITY.MEDIUM ? 'Medium' : 'Low'})`,
				value: null,
			}, { type: 'divider' }, {
				label: 'High',
				value: GRAPHICS_QUALITY.HIGH,
			}, {
				label: 'Medium',
				value: GRAPHICS_QUALITY.MEDIUM,
			}, {
				label: 'Low',
				value: GRAPHICS_QUALITY.LOW,
			}],
			ref: graphicsQualityRaw,
		}, {
			type: 'radio',
			text: i18n.ts._miWorld.frameRateLimitation,
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
			text: i18n.ts._miWorld.resolution,
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
			type: 'switch',
			text: i18n.ts._miWorld.antialiasing,
			ref: antialias,
		}],
	}], ev.currentTarget ?? ev.target);
}

async function changeRoomName() {
	const { canceled, result } = await os.inputText({
		title: i18n.ts.name,
		default: props.room.name,
	});
	if (canceled) return;

	os.apiWithDialog('world/rooms/update', {
		roomId: props.room.id,
		name: result,
	}).then(() => {
		props.room.name = result;
	});
}

function leaveOnline() {
	multiplayer.left();
}

function enterOnline() {
	const closeWaiting = os.waiting();
	multiplayer.enter().finally(() => {
		closeWaiting();
	});
}
</script>

<style lang="scss" module>
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
	touch-action: none;
	background: #000;

	&:focus {
		outline: none;
	}
}

.floatingButton {
	background: var(--MI_THEME-panel);
	padding: 8px;
	width: 50px;
	box-sizing: border-box;
	aspect-ratio: 1;
	border-radius: 999px;
	display: grid;
	place-items: center;
	pointer-events: auto;
	font-size: 15px;
}

.joystick {
}

.overlayTop {
	position: absolute;
	top: 0;
	left: 0;
	z-index: 1;
	width: 100%;
	pointer-events: none;
}

.overlayBottom {
	position: absolute;
	bottom: 0;
	left: 0;
	z-index: 1;
	width: 100%;
	pointer-events: none;
}

.topMain {
	display: flex;
	align-items: center;
	gap: 16px;
	pointer-events: none;
}

.topMenu {
	margin: 16px;
	display: flex;
	flex-wrap: wrap;
	box-sizing: border-box;
	width: max-content;
	gap: 8px;
	pointer-events: none;
}

.modified {
	display: flex;
	align-items: center;
	font-size: 90%;
	gap: 1em;
	padding: 8px 16px;
	pointer-events: auto;
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
	margin: 16px auto;
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	box-sizing: border-box;
	width: max-content;
	pointer-events: auto;
}
.overlayControls:empty {
	display: none;
}

.pointedPlayerInfoAvatar {
	width: 32px;
	height: 32px;
	border-radius: 100%;
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
