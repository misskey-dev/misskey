<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="1000"
	:height="600"
	:scroll="false"
	:withOkButton="false"
	@close="cancel()"
	@closed="emit('closed')"
>
	<template #header><i class="ti ti-user"></i> Avatar</template>

	<div :class="$style.root">
		<div v-if="!controller.isReady" :class="$style.loading">
			<MkLoading/>
		</div>

		<div :class="$style.previewContainer">
			<div :class="$style.preview">
				<MkButton :class="$style.customizeButton" small rounded iconOnly @click="showOptions = !showOptions"><i class="ti ti-tool"></i></MkButton>

				<div :class="[$style.previewMain, { [$style.optionsOpened]: showOptions }]">
					<canvas ref="canvas" :class="$style.canvas"></canvas>
				</div>

				<Transition
					:enterActiveClass="prefer.s.animation ? $style.transition_options_enterActive : ''"
					:leaveActiveClass="prefer.s.animation ? $style.transition_options_leaveActive : ''"
					:enterFromClass="prefer.s.animation ? $style.transition_options_enterFrom : ''"
					:leaveToClass="prefer.s.animation ? $style.transition_options_leaveTo : ''"
				>
					<div v-if="showOptions" :class="$style.customize">
						<MkInput :modelValue="getHex(avatar.body.color)" type="color" :throttle="300" @update:modelValue="v => { const c = getRgb(v); if (c != null) avatar.body.color = c; }">
							<template #label>{{ i18n.ts.color }}</template>
						</MkInput>
					</div>
				</Transition>
			</div>
		</div>
	</div>
</MkModalWindow>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch, onMounted, onUnmounted, reactive, nextTick, shallowRef, computed, triggerRef, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import { OBJECT_SCHEMA_DEFS } from 'misskey-world/src/room/object-schema-defs.js';
import { getHex, getRgb } from 'misskey-world/src/utility.js';
import type { Ref } from 'vue';
import type { RawOptions } from 'misskey-world/src/room/object.js';
import type { RoomAttachments } from 'misskey-world/src/room/type.js';
import type { WorldAvatar } from 'misskey-world/src/types.js';
import type { AvatarPreviewEngineControllerOptions } from '@/world/avatarPreviewEngineController.js';
import { AvatarPreviewEngineController } from '@/world/avatarPreviewEngineController.js';
import { i18n } from '@/i18n.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import * as os from '@/os.js';
import MkButton from '@/components/MkButton.vue';
import { prefer } from '@/preferences.js';
import { deepClone } from '@/utility/clone.js';
import { store } from '@/store.js';
import MkInput from '@/components/MkInput.vue';
import { withTimeout } from '@/utility/promise-timeout.js';
import { $i } from '@/i.js';

const props = defineProps<{
	graphicsQuality: number;
	avatar: WorldAvatar | null;
}>();

const emit = defineEmits<{
	(ev: 'ok', ctx: {
		id: string;
		options: RawOptions;
		attachments: RoomAttachments;
	}): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');
const canvas = useTemplateRef('canvas');
const showOptions = ref(false);

const avatar: Ref<WorldAvatar> = ref(props.avatar != null ? deepClone(props.avatar) : {
	type: 'default',
	body: {
		color: [0.8, 0.8, 0.8],
		roughness: 1,
		metallic: 0,
	},
	eyes: {
		type: 'a',
		color: [0, 0, 0],
	},
	mouth: {
		type: 'a',
		color: [0, 0, 0],
	},
	accessories: [],
});

const avatarPreviewEngineControllerOptions = computed<AvatarPreviewEngineControllerOptions>(() => ({
	graphicsQuality: props.graphicsQuality,
	fps: null,
	resolution: 1,
	workerMode: prefer.s['world.separateRenderingThread'],
}));

const controller = markRaw(new AvatarPreviewEngineController(avatarPreviewEngineControllerOptions.value));

watch(avatar, () => {
	controller.updateAvatar(avatar.value);
}, { deep: true });

onMounted(async () => {
	try {
		await controller.init(canvas.value!, {
			name: $i.name,
			username: $i.username,
			avatarUrl: $i.avatarUrl,
			worldAvatar: avatar.value,
		});
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
});

onUnmounted(() => {
	controller.destroy();
});

function updateObjectOption(k: string, v: any) {
	controller.updateObjectOption(k, v, attachments);
	selectedObjectOptionsState.value![k] = v;
}

function ok() {
	if (selectedId.value == null) return;

	let recentlyUsed = store.s.recentlyUsedRoomObjects;
	if (recentlyUsed.includes(selectedId.value)) recentlyUsed = recentlyUsed.filter(id => id !== selectedId.value);
	recentlyUsed.unshift(selectedId.value);
	if (recentlyUsed.length > 30) recentlyUsed.pop();
	store.set('recentlyUsedRoomObjects', recentlyUsed);

	emit('ok', {
		id: selectedId.value,
		options: deepClone(selectedObjectOptionsState.value!),
		attachments: deepClone(attachments),
	});

	dialog.value?.close();
}

async function cancel() {
	emit('cancel');
	dialog.value?.close();
}
</script>

<style module>
.root {
	container-type: inline-size;
	height: 100%;
	position: relative;
}

.loading {
	position: absolute;
	width: 100%;
	height: 100%;
	display: grid;
	place-items: center;
}

.main {
	height: 100%;
	box-sizing: border-box;
	overflow-y: scroll;
	background: var(--MI_THEME-bg);
}

.catalogItems {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
	grid-gap: 12px;
	padding: 8px 0;
	box-sizing: border-box;
}

.catalogItem {
}

.previewContainer {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 10;
	overflow: clip;
	backdrop-filter: blur(12px);
}

.preview {
	position: absolute;
	bottom: 0;
	left: 0;
	width: 100%;
	/*height: calc(100% - 30px);*/
	height: 100%;
	z-index: 10;
	/*border-radius: 16px 16px 0 0;*/
	overflow: clip;
	container-type: size;
	background: var(--MI_THEME-panel)
}

.previewMain {
	width: 100%;
	height: 100%;
	overflow: clip;
	contain: strict;
	transition: width 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.previewMain.optionsOpened {
	width: calc(100% - 300px);
}

.canvas {
	position: relative;
	left: 50%;
	transform: translateX(-50%);
	width: 100cqw;
	height: 100cqh;
	display: block;
	touch-action: none;
	background: #000;
	cursor: grab;
}
.canvas:focus {
	outline: none;
}

.unselectButton {
	position: absolute;
	top: 10px;
	left: 10px;
	z-index: 2;
}

.customizeButton {
	position: absolute;
	top: 10px;
	right: 10px;
	z-index: 2;
}

.addButton {
	position: absolute;
	bottom: 10px;
	left: 0;
	right: 0;
	margin: 0 auto;
}

.customize {
	position: absolute;
	top: 0;
	right: 0;
	height: stretch;
	width: 300px;
	overflow: auto;
	box-sizing: border-box;
	padding: 32px 16px 16px 16px;
	background: var(--MI_THEME-panel);
}

.transition_preview_enterActive,
.transition_preview_leaveActive {
	opacity: 1;
	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.transition_preview_enterFrom,
.transition_preview_leaveTo {
	opacity: 0;
}

.transition_preview_enterActive .preview,
.transition_preview_leaveActive .preview {
	transform: translateX(0);
	transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.transition_preview_enterFrom .preview,
.transition_preview_leaveTo .preview {
	transform: translateY(200px);
}

.transition_options_enterActive,
.transition_options_leaveActive {
	opacity: 1;
	transform: translateX(0);
	transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.transition_options_enterFrom,
.transition_options_leaveTo {
	opacity: 0;
	transform: translateX(200px);
}
</style>
