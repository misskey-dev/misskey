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
				<div :class="$style.topMenuRow">
					<template v-if="isNarrow">
						<button v-if="isMenuShowing" v-tooltip.noDelay="i18n.ts.menu" :class="$style.floatingButton" class="_button" style="color: var(--MI_THEME-accent)" @click="isMenuShowing = false"><i class="ti ti-menu"></i></button>
						<button v-if="!isMenuShowing" v-tooltip.noDelay="i18n.ts.menu" :class="$style.floatingButton" class="_button" @click="isMenuShowing = true"><i class="ti ti-menu"></i></button>
					</template>

					<template v-if="isMenuShowing">
						<template v-if="controller.isReady.value">
							<button v-if="multiplayer.isOnline.value" v-tooltip.noDelay="i18n.ts._miWorld.onlineMenu" :class="$style.floatingButton" class="_button" style="color: var(--MI_THEME-accent)" @click="showOnlineMenu"><i class="ti ti-world"></i></button>
							<button v-if="!multiplayer.isOnline.value" v-tooltip.noDelay="i18n.ts._miWorld.onlineMenu" :class="$style.floatingButton" class="_button" @click="showOnlineMenu"><i class="ti ti-world"></i></button>

							<button v-tooltip.noDelay="i18n.ts._miWorld.character" :class="$style.floatingButton" class="_button" @click="showCharacterMenu"><i class="ti ti-man"></i></button>

							<button v-tooltip.noDelay="i18n.ts._miWorld.takeScreenShot" :class="$style.floatingButton" class="_button" @click="takeScreenshot"><i class="ti ti-camera"></i></button>
						</template>

						<button v-tooltip.noDelay="i18n.ts.other" :class="$style.floatingButton" class="_button" @click="showOtherMenu"><i class="ti ti-dots"></i></button>
					</template>
				</div>
			</div>
		</div>
	</div>

	<div :class="$style.overlayBottom">
		<div v-if="controller.isReady.value" :class="$style.overlayControls">
			<MkButton v-if="controller.isSitting.value" @click="controller.standUp()">{{ i18n.ts._miWorld.standUp }} (Q)</MkButton>
		</div>

		<MkVirtualJoystick v-if="useVirtualJoystick && controller.isReady.value" :class="$style.joystick" @update="v => controller.setCameraJoystickMoveVector(v)"/>
	</div>

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
import { computed, defineAsyncComponent, markRaw, nextTick, onActivated, onDeactivated, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { GRAPHICS_QUALITY } from 'misskey-world-engine/src/utility.js';
import { useInterval } from '@@/js/use-interval.js';
import XOverlayPanel from './rooms/OverlayPanel.vue';
import type { WorldEngineControllerOptions } from '@/world/controller.js';
import type { PlayerProfile } from 'misskey-world-engine/src/PlayerContainer.js';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import { ensureSignin } from '@/i';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import * as os from '@/os.js';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import { WorldEngineController } from '@/world/controller.js';
import { prefer } from '@/preferences.js';
import { isTouchUsing } from '@/utility/touch.js';
import { deviceKind } from '@/utility/device-kind.js';
import MkProgressBar from '@/components/MkProgressBar.vue';
import { Multiplayer } from '@/world/Multiplayer.js';
import { $i } from '@/i.js';
import { userPage } from '@/filters/user.js';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import MkVirtualJoystick from '@/components/MkVirtualJoystick.vue';

const canvasKey = ref(0); // 一度ワーカーに渡したcanvasは再利用できないため作り直すためのkey
const canvas = useTemplateRef('canvas');

const isNarrow = deviceKind === 'smartphone';

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
const showUsernameOnAvatar = prefer.model('world.showUsernameOnAvatar');
const show2dAvatarOnAvatar = prefer.model('world.show2dAvatarOnAvatar');

const useVirtualJoystick = isTouchUsing && (deviceKind === 'smartphone' || deviceKind === 'tablet');

const worldControllerOptions = computed<WorldEngineControllerOptions>(() => ({
	graphicsQuality: graphicsQuality.value,
	fps: fps.value,
	resolution: resolution.value,
	antialias: antialias.value,
	useVirtualJoystick,
	fov: prefer.s['world.fov'],
	workerMode: prefer.s['world.separateRenderingThread'],
	showUsernameOnAvatar: showUsernameOnAvatar.value,
	show2dAvatarOnAvatar: show2dAvatarOnAvatar.value,
}));

const controller = markRaw(new WorldEngineController(worldControllerOptions.value));
const multiplayer = markRaw(new Multiplayer('world:main:0', controller));

const pointedPlayerInfo = ref<PlayerProfile | null>(null);
const isMenuShowing = ref(!isNarrow);
const isPlayerInfoOpen = ref(false);

watch([graphicsQuality, fps, resolution, antialias], () => {
	refresh();
});

watch([showUsernameOnAvatar, show2dAvatarOnAvatar], () => {
	controller.updateAvatarDisplayOptions({
		showUsername: showUsernameOnAvatar.value,
		show2dAvatar: show2dAvatarOnAvatar.value,
	});
});

controller.addListener('playerPointed', ({ playerId }) => {
	pointedPlayerInfo.value = multiplayer.playerProfiles[playerId] ?? null;
	isPlayerInfoOpen.value = true;
});

async function refresh() {
	canvasKey.value++;
	await nextTick();
	await controller.reset(canvas.value!, worldControllerOptions.value);
}

async function takeScreenshot() {
	await controller.downloadScreenshot();
}

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
		await controller.init(canvas.value!);
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

function showCharacterMenu(ev: PointerEvent) {
	os.popupMenu([{
		text: i18n.ts._miWorld.sit,
		action: () => {
			controller.sit();
			canvas.value!.focus();
		},
	}, {
		text: i18n.ts._miWorld.lyingDown,
		action: () => {
			controller.lyingDown();
			canvas.value!.focus();
		},
	}], ev.currentTarget ?? ev.target);
}

function showOnlineMenu(ev: PointerEvent) {
	os.popupMenu([{
		text: multiplayer.isOnline.value ? i18n.ts._miWorld.disconnectToOnline : i18n.ts._miWorld.connectToOnline,
		icon: multiplayer.isOnline.value ? 'ti ti-world-off' : 'ti ti-world',
		danger: multiplayer.isOnline.value,
		action: () => {
			if (multiplayer.isOnline.value) {
				leaveOnline();
			} else {
				enterOnline();
			}
		},
	}, {
		type: 'divider',
	}, {
		type: 'parent',
		text: i18n.ts.settings,
		icon: 'ti ti-settings',
		children: [{
			type: 'switch',
			text: i18n.ts._miWorld.showUsernameOnAvatar,
			ref: showUsernameOnAvatar,
		}, {
			type: 'switch',
			text: i18n.ts._miWorld.show2dAvatarOnAvatar,
			ref: show2dAvatarOnAvatar,
		}],
	}], ev.currentTarget ?? ev.target);
}

function showOtherMenu(ev: PointerEvent) {
	os.popupMenu([{
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

function leaveOnline() {
	multiplayer.left();
}

function enterOnline() {
	const closeWaiting = os.waiting();
	multiplayer.enter().finally(() => {
		closeWaiting();
	});
}

definePage(() => ({
	title: 'World',
	icon: 'ti ti-universe',
	needWideArea: true,
}));
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
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin: 16px;
	pointer-events: none;
}
.topMenuRow {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	pointer-events: none;
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
