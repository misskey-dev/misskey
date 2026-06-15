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
	<template #header><i class="ti ti-box"></i> カタログ</template>

	<div :class="[$style.root, { [$style.isNarrow]: isNarrow, [$style.isWide]: !isNarrow }]">
		<div v-if="!controller.isReady.value" :class="$style.loading">
			<MkLoading/>
		</div>
		<div v-else :class="$style.main">
			<div class="_spacer _gaps">
				<MkInput v-model="searchKeyword" type="search" :placeholder="i18n.ts.search">
					<template #prefix><i class="ti ti-search"></i></template>
				</MkInput>
				<div class="_buttons">
					<MkButton v-tooltip="i18n.ts._miRoom._furniturePlacement.top" :primary="placementFilter === 'top'" small iconOnly @click="placementFilter = placementFilter === 'top' ? null : 'top'"><i class="ti ti-transition-bottom"></i></MkButton>
					<MkButton v-tooltip="i18n.ts._miRoom._furniturePlacement.side" :primary="placementFilter === 'side'" small iconOnly @click="placementFilter = placementFilter === 'side' ? null : 'side'"><i class="ti ti-transition-left"></i></MkButton>
					<MkButton v-tooltip="i18n.ts._miRoom._furniturePlacement.bottom" :primary="placementFilter === 'bottom'" small iconOnly @click="placementFilter = placementFilter === 'bottom' ? null : 'bottom'"><i class="ti ti-transition-top"></i></MkButton>
				</div>

				<MkFoldableSection v-if="searchResult.length > 0" :expanded="true">
					<template #header><i class="ti ti-search"></i> {{ i18n.ts.searchResult }}</template>
					<div :class="$style.catalogItems">
						<XItem v-for="def in searchResult" :key="def.id" :def="def" :class="[$style.catalogItem]" @click="selectedId = def.id"/>
					</div>
				</MkFoldableSection>
				<MkFoldableSection v-if="recentlyUsedSchemas.length > 0" :expanded="true">
					<template #header><i class="ti ti-history"></i> {{ i18n.ts.recentUsed }}</template>
					<div :class="$style.catalogItems">
						<XItem v-for="def in recentlyUsedSchemas" :key="def.id" :def="def" :class="[$style.catalogItem]" @click="selectedId = def.id"/>
					</div>
				</MkFoldableSection>
				<MkFoldableSection :expanded="true">
					<template #header>{{ i18n.ts.all }}</template>
					<div :class="$style.catalogItems">
						<XItem v-for="def in FURNITURE_SCHEMA_DEFS" :key="def.id" :def="def" :class="[$style.catalogItem]" @click="selectedId = def.id"/>
					</div>
				</MkFoldableSection>
			</div>
		</div>
		<Transition
			:enterActiveClass="prefer.s.animation ? $style.transition_preview_enterActive : ''"
			:leaveActiveClass="prefer.s.animation ? $style.transition_preview_leaveActive : ''"
			:enterFromClass="prefer.s.animation ? $style.transition_preview_enterFrom : ''"
			:leaveToClass="prefer.s.animation ? $style.transition_preview_leaveTo : ''"
			:duration="300"
		>
			<div v-show="showPreview" :class="$style.previewContainer" @click="selectedId = null">
				<div :class="$style.preview" @click.stop>
					<MkButton :class="$style.unselectButton" small rounded iconOnly @click="selectedId = null"><i class="ti ti-x"></i></MkButton>
					<MkButton v-if="selectedFunitureSchema != null && Object.keys(selectedFunitureSchema.options.schema).length > 0" :class="$style.customizeButton" small rounded iconOnly @click="showFurnitureOptions = !showFurnitureOptions"><i class="ti ti-tool"></i></MkButton>

					<div :class="[$style.previewMain, { [$style.optionsOpened]: selectedFunitureSchema != null && selectedInstanceId != null && showFurnitureOptions }]">
						<canvas ref="canvas" :class="$style.canvas"></canvas>
						<MkButton :class="$style.addButton" small rounded primary @click="ok"><i class="ti ti-plus"></i></MkButton>
					</div>

					<Transition
						:enterActiveClass="prefer.s.animation ? $style.transition_options_enterActive : ''"
						:leaveActiveClass="prefer.s.animation ? $style.transition_options_leaveActive : ''"
						:enterFromClass="prefer.s.animation ? $style.transition_options_enterFrom : ''"
						:leaveToClass="prefer.s.animation ? $style.transition_options_leaveTo : ''"
					>
						<div v-if="selectedFunitureSchema != null && selectedInstanceId != null && showFurnitureOptions" :class="$style.customize">
							<MkWorldMonoOptionsForm
								:uiDef="FURNITURE_UI_DEFS[selectedFunitureSchema.id]"
								:addFileAttachment="addFileAttachment"
								:schema="selectedFunitureSchema.options.schema"
								:options="selectedFunitureOptionsState"
								@update="(k, v) => updateFurnitureOption(k, v)"
							/>
						</div>
					</Transition>
				</div>
			</div>
		</Transition>
	</div>
</MkModalWindow>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch, onMounted, onUnmounted, reactive, nextTick, shallowRef, computed, triggerRef, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import { FURNITURE_SCHEMA_DEFS } from 'misskey-world/src/room/furniture-schema-defs.js';
import { throttle } from 'throttle-debounce';
import XItem from './room.add-furniture-dialog.item.vue';
import type { PreviewEngineControllerOptions } from '@/world/room/previewEngineController.js';
import type { RoomAttachments } from 'misskey-world/src/room/type.js';
import type { RawOptions } from 'misskey-world/src/mono.js';
import type { FurnitureSchemaDef } from 'misskey-world/src/room/furniture.js';
import MkWorldMonoOptionsForm from '@/components/MkWorldMonoOptionsForm.vue';
import { i18n } from '@/i18n.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import * as os from '@/os.js';
import MkButton from '@/components/MkButton.vue';
import { prefer } from '@/preferences.js';
import { deepClone } from '@/utility/clone.js';
import { store } from '@/store.js';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { PreviewEngineController } from '@/world/room/previewEngineController.js';
import MkInput from '@/components/MkInput.vue';
import { withTimeout } from '@/utility/promise-timeout.js';
import { FURNITURE_UI_DEFS } from '@/world/room/furniture-ui-defs.js';
import { deviceKind } from '@/utility/device-kind.js';
import MkRadios from '@/components/MkRadios.vue';

// TODO: instanceのidと紛らわしいのでid -> typeにする

const isNarrow = deviceKind === 'smartphone' || window.innerWidth < 600;

const props = defineProps<{
	graphicsQuality: number;
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
const selectedId = ref<string | null>(null);
const showPreview = ref(false);
const selectedInstanceId = ref<string | null>(null);
const selectedFunitureOptionsState = ref<RawOptions | null>(null);
const selectedFunitureSchema = computed(() => selectedId.value == null ? null : FURNITURE_SCHEMA_DEFS[selectedId.value]);
const showFurnitureOptions = ref(false);
const searchKeyword = ref('');
const searchResult = ref<FurnitureSchemaDef<any>[]>([]);
const placementFilter = ref<'top' | 'side' | 'bottom' | null>(null);

const attachments = {
	files: [],
} as RoomAttachments;

function addFileAttachment(file: Misskey.entities.DriveFile) {
	attachments.files.push(file);
}

const previewEngineControllerOptions = computed<PreviewEngineControllerOptions>(() => ({
	graphicsQuality: props.graphicsQuality,
	fps: null,
	resolution: 1,
	workerMode: prefer.s['world.separateRenderingThread'],
}));

const controller = markRaw(new PreviewEngineController(previewEngineControllerOptions.value));

const recentlyUsedSchemas = computed(() => {
	const recentlyUsed = store.s.recentlyUsedRoomFurnitures;
	return recentlyUsed.map(id => FURNITURE_SCHEMA_DEFS[id]).filter((def): def is typeof FURNITURE_SCHEMA_DEFS[string] => def != null);
});

watch([searchKeyword, placementFilter], () => {
	const kw = searchKeyword.value.trim().toLowerCase();
	if (kw === '' && placementFilter.value == null) {
		searchResult.value = [];
		return;
	}

	searchResult.value = Object.values(FURNITURE_SCHEMA_DEFS);

	if (kw !== '') {
		searchResult.value = searchResult.value.filter(def => (def.id.includes(kw) || FURNITURE_UI_DEFS[def.id].name.toLowerCase().includes(kw)) && (placementFilter.value == null || def.placement === placementFilter.value));
	}

	if (placementFilter.value != null) {
		if (placementFilter.value === 'top') {
			searchResult.value = searchResult.value.filter(def => def.placement === 'top' || def.placement === 'floor');
		} else if (placementFilter.value === 'side') {
			searchResult.value = searchResult.value.filter(def => def.placement === 'side' || def.placement === 'wall');
		} else if (placementFilter.value === 'bottom') {
			searchResult.value = searchResult.value.filter(def => def.placement === 'bottom' || def.placement === 'ceiling');
		}
	}
});

onMounted(async () => {
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
});

onUnmounted(() => {
	controller.destroy();
});

watch(selectedId, (newId) => {
	showFurnitureOptions.value = false;
	showPreview.value = false;

	if (!controller.isReady.value) return;

	if (newId == null) {
		controller.clearFurniture();
		controller.pauseRender();
		selectedInstanceId.value = null;
		selectedFunitureOptionsState.value = null;
	} else {
		const closeWaiting = os.waiting();
		nextTick(() => {
			try {
				withTimeout(controller.loadFurniture(newId), 10000).then(res => {
					selectedInstanceId.value = res.id;
					selectedFunitureOptionsState.value = deepClone(res.options);
					controller.resumeRender();
					closeWaiting();
					showPreview.value = true;
					nextTick(() => {
						controller.resize();
					});
				}).catch(err => {
					closeWaiting();
					throw err;
				});
			} catch (err) {
				closeWaiting();
				throw err;
			}
		});
	}
});

const updateFurnitureOption = throttle(100, (k: string, v: any) => {
	controller.updateFurnitureOption(k, deepClone(v), attachments);
	selectedFunitureOptionsState.value![k] = v;
});

function ok() {
	if (selectedId.value == null) return;

	let recentlyUsed = store.s.recentlyUsedRoomFurnitures;
	if (recentlyUsed.includes(selectedId.value)) recentlyUsed = recentlyUsed.filter(id => id !== selectedId.value);
	recentlyUsed.unshift(selectedId.value);
	if (recentlyUsed.length > 30) recentlyUsed.pop();
	store.set('recentlyUsedRoomFurnitures', recentlyUsed);

	emit('ok', {
		id: selectedId.value,
		options: deepClone(selectedFunitureOptionsState.value!),
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
	transition: width 300ms cubic-bezier(0.23, 1, 0.32, 1), height 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.root.isWide .previewMain.optionsOpened {
	width: calc(100% - 300px);
}
.root.isNarrow .previewMain.optionsOpened {
	height: 50%;
}

.canvas {
	position: relative;
	top: 50%;
	left: 50%;
	transform: translateX(-50%) translateY(-50%);
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
	overflow: auto;
	overscroll-behavior: contain;
	scrollbar-gutter: stable;
	box-sizing: border-box;
	padding: 32px 16px 16px 16px;
	background: var(--MI_THEME-panel);
}
.root.isWide .customize {
	top: 0;
	right: 0;
	width: 300px;
	height: 100%;
}
.root.isNarrow .customize {
	bottom: 0;
	left: 0;
	width: 100%;
	height: 50%;
}

.transition_options_enterActive,
.transition_options_leaveActive {
	opacity: 1;
	transform: translateX(0);
	transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.root.isWide .transition_options_enterFrom,
.root.isWide .transition_options_leaveTo {
	opacity: 0;
	transform: translateX(200px);
}
.root.isNarrow .transition_options_enterFrom,
.root.isNarrow .transition_options_leaveTo {
	opacity: 0;
	transform: translateY(200px);
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
</style>
