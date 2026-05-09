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

	<div :class="$style.root">
		<div :class="$style.main">
			<MkFoldableSection v-if="recentlyUsedDefs.length > 0" :expanded="true">
				<template #header>{{ i18n.ts.recentUsed }}</template>
				<div :class="$style.catalogItems">
					<XItem v-for="def in recentlyUsedDefs" :key="def.id" :def="def" :class="[$style.catalogItem]" @click="selectedId = def.id"/>
				</div>
			</MkFoldableSection>
			<MkFoldableSection :expanded="true">
				<template #header>{{ i18n.ts.all }}</template>
				<div :class="$style.catalogItems">
					<XItem v-for="def in OBJECT_DEFS" :key="def.id" :def="def" :class="[$style.catalogItem]" @click="selectedId = def.id"/>
				</div>
			</MkFoldableSection>
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
					<canvas ref="canvas" :class="$style.canvas"></canvas>
					<MkButton :class="$style.unselectButton" small rounded iconOnly @click="selectedId = null"><i class="ti ti-x"></i></MkButton>
					<MkButton v-if="selectedObjectDef != null && Object.keys(selectedObjectDef.options.schema).length > 0" :class="$style.customizeButton" small rounded iconOnly @click="showObjectOptions = !showObjectOptions"><i class="ti ti-tool"></i></MkButton>
					<MkButton :class="$style.addButton" small rounded primary @click="ok"><i class="ti ti-plus"></i></MkButton>

					<Transition
						:enterActiveClass="prefer.s.animation ? $style.transition_options_enterActive : ''"
						:leaveActiveClass="prefer.s.animation ? $style.transition_options_leaveActive : ''"
						:enterFromClass="prefer.s.animation ? $style.transition_options_enterFrom : ''"
						:leaveToClass="prefer.s.animation ? $style.transition_options_leaveTo : ''"
					>
						<div v-if="selectedObjectDef != null && selectedInstanceId != null && showObjectOptions" :class="$style.customize" class="_panel _shadow">
							<XObjectCustomizeForm :schema="selectedObjectDef.options.schema" :options="selectedObjectOptionsState" @update="(k, v) => updateObjectOption(k, v)"></XObjectCustomizeForm>
						</div>
					</Transition>
				</div>
			</div>
		</Transition>
	</div>
</MkModalWindow>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch, onMounted, onUnmounted, reactive, nextTick, shallowRef, computed, triggerRef } from 'vue';
import XObjectCustomizeForm from './room.object-customize-form.vue';
import XItem from './room.add-object-dialog.item.vue';
import type { RoomObjectInstance, RoomStateObject } from '@/world/room/object.js';
import { i18n } from '@/i18n.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import * as os from '@/os.js';
import { OBJECT_DEFS } from '@/world/room/object-defs.js';
import { createRoomObjectPreviewEngine, RoomObjectPreviewEngine } from '@/world/room/previewEngine.js';
import { camelToKebab } from '@/world/utility.js';
import MkButton from '@/components/MkButton.vue';
import { prefer } from '@/preferences.js';
import { deepClone } from '@/utility/clone.js';
import { store } from '@/store.js';
import MkFoldableSection from '@/components/MkFoldableSection.vue';

// TODO: instanceのidと紛らわしいのでid -> typeにする

const emit = defineEmits<{
	(ev: 'ok', ctx: {
		id: string;
		options: any;
	}): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');
const canvas = useTemplateRef('canvas');
const selectedId = ref<string | null>(null);
const showPreview = ref(false);
const selectedInstanceId = ref<string | null>(null);
const selectedObjectOptionsState = ref<RoomStateObject | null>(null);
const selectedObjectDef = computed(() => OBJECT_DEFS.find(def => def.id === selectedId.value) ?? null);
const showObjectOptions = ref(false);
const engine = shallowRef<RoomObjectPreviewEngine | null>(null);

const recentlyUsedDefs = computed(() => {
	const recentlyUsed = store.s.recentlyUsedRoomObjects;
	return recentlyUsed.map(id => OBJECT_DEFS.find(def => def.id === id)).filter((def): def is typeof OBJECT_DEFS[number] => def != null);
});

onMounted(async () => {
	engine.value = await createRoomObjectPreviewEngine(canvas.value!);

	await engine.value.init();
});

onUnmounted(() => {
	engine.value.destroy();
});

watch(selectedId, (newId) => {
	showObjectOptions.value = false;
	showPreview.value = false;

	if (newId == null) {
		engine.value!.clear();
		engine.value!.pauseRender();
		selectedInstanceId.value = null;
		selectedObjectOptionsState.value = null;
	} else {
		const closeWaiting = os.waiting();
		nextTick(() => {
			engine.value!.load(newId).then(res => {
				selectedInstanceId.value = res.id;
				selectedObjectOptionsState.value = deepClone(res.options);
				engine.value!.resumeRender();
				closeWaiting();
				showPreview.value = true;
				nextTick(() => {
					engine.value!.resize();
				});
			}).catch(err => {
				console.error(err);
				closeWaiting();
			});
		});
	}
});

function updateObjectOption(k: string, v: any) {
	const updatedOptions = engine.value!.updateObjectOption(k, v);
	selectedObjectOptionsState.value = deepClone(updatedOptions);
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
		options: deepClone(selectedObjectOptionsState.value),
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
	padding: 12px;
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
	height: calc(100% - 30px);
	z-index: 10;
	border-radius: 16px 16px 0 0;
	overflow: clip;
	background: var(--MI_THEME-panel)
}

.canvas {
	width: 100%;
	height: 100%;
	display: block;
}
.canvas:focus {
	outline: none;
}

.unselectButton {
	position: absolute;
	top: 10px;
	left: 10px;
}

.customizeButton {
	position: absolute;
	top: 10px;
	right: 10px;
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
	margin: 32px 8px 8px 8px;
	max-height: stretch;
	width: 300px;
	overflow: auto;
	box-sizing: border-box;
	padding: 24px;
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
