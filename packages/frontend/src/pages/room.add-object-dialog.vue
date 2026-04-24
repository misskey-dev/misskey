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
	:withOkButton="true"
	@close="cancel()"
	@ok="ok()"
	@closed="emit('closed')"
>
	<template #header><i class="ti ti-box"></i> カタログ</template>

	<div :class="$style.root">
		<div :class="$style.catalogItems">
			<div
				v-for="def in OBJECT_DEFS"
				:key="def.id"
				class="_panel"
				:class="[$style.catalogItem, { [$style.selected]: selectedId === def.id }]"
				@click="selectedId = def.id"
			>
				<img :class="$style.catalogItemThumbnail" :src="`/client-assets/room/object-thumbs/${camelToKebab(def.id)}.png`"/>
				<div :class="$style.catalogItemName"><MkCondensedLine :minScale="0.5">{{ def.name }}</MkCondensedLine></div>
			</div>
		</div>
		<div v-show="selectedId != null" :class="$style.preview" class="_panel">
			<canvas ref="canvas" :class="$style.canvas"></canvas>
			<MkButton :class="$style.unselectButton" small iconOnly @click="selectedId = null"><i class="ti ti-x"></i></MkButton>
			<MkButton v-if="selectedObjectDef != null && Object.keys(selectedObjectDef.options.schema).length > 0" :class="$style.customizeButton" small iconOnly @click="showObjectOptions = !showObjectOptions"><i class="ti ti-settings"></i></MkButton>

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
</MkModalWindow>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch, onMounted, onUnmounted, reactive, nextTick, shallowRef, computed, triggerRef } from 'vue';
import XObjectCustomizeForm from './room.object-customize-form.vue';
import type { RoomObjectInstance, RoomStateObject } from '@/world/room/object.js';
import { i18n } from '@/i18n.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import * as os from '@/os.js';
import { OBJECT_DEFS } from '@/world/room/object-defs.js';
import { createRoomObjectPreviewEngine, RoomObjectPreviewEngine } from '@/world/room/previewEngine.js';
import { camelToKebab } from '@/world/utility.js';
import MkButton from '@/components/MkButton.vue';
import { prefer } from '@/preferences.js';

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
const selectedInstanceId = ref<string | null>(null);
const selectedObjectOptionsState = shallowRef<RoomStateObject | null>(null);
const selectedObjectDef = computed(() => OBJECT_DEFS.find(def => def.id === selectedId.value) ?? null);
const showObjectOptions = ref(false);
const engine = shallowRef<RoomObjectPreviewEngine | null>(null);

onMounted(async () => {
	engine.value = await createRoomObjectPreviewEngine(canvas.value!);

	engine.value.init();

	canvas.value!.focus();
});

onUnmounted(() => {
	engine.value.destroy();
});

watch(selectedId, (newId) => {
	showObjectOptions.value = false;

	if (newId == null) {
		engine.value!.clear();
		selectedInstanceId.value = null;
		selectedObjectOptionsState.value = null;
	} else {
		nextTick(() => {
			engine.value!.load(newId).then(res => {
				selectedInstanceId.value = res.id;
				selectedObjectOptionsState.value = res.options;
				engine.value!.resize();
			});
		});
	}
});

function updateObjectOption(k: string, v: any) {
	engine.value!.updateObjectOption(k, v);
	triggerRef(selectedObjectOptionsState);
}

function ok() {
	if (selectedId.value == null) return;
	emit('ok', {
		id: selectedId.value,
		options: selectedObjectOptionsState.value,
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

.catalogItems {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
	grid-gap: 12px;
	padding: 12px;
	height: 100%;
	box-sizing: border-box;
	overflow-y: scroll;
	background: var(--MI_THEME-bg);
}

.catalogItem {
	padding: 12px;
	border: 1px solid var(--border-color);
	border-radius: 4px;
	cursor: pointer;
}
.selected {
	color: var(--MI_THEME-accent);
	background-color: var(--MI_THEME-accentedBg);
}

.catalogItemThumbnail {
	width: 100%;
	aspect-ratio: 1;
}

.catalogItemName {
	text-align: center;
}

.preview {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	overflow: clip;
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
	top: 8px;
	left: 8px;
}

.customizeButton {
	position: absolute;
	top: 8px;
	right: 8px;
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
