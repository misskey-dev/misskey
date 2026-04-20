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
				:class="[$style.catalogItem, { [$style.selected]: selectedId === def.id }]"
				@click="selectedId = def.id"
			>
				<img :class="$style.catalogItemThumbnail" :src="`/client-assets/room/object-thumbs/${camelToKebab(def.id)}.png`"/>
				<div :class="$style.catalogItemName">{{ def.name }}</div>
			</div>
		</div>
		<div v-show="selectedId != null" :class="$style.preview" class="_panel">
			<canvas ref="canvas" :class="$style.canvas"></canvas>
			<button :class="$style.unselectButton" @click="selectedId = null">x</button>
		</div>
	</div>
</MkModalWindow>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch, onMounted, onUnmounted, reactive, nextTick, shallowRef } from 'vue';
import { i18n } from '@/i18n.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import * as os from '@/os.js';
import { OBJECT_DEFS } from '@/world/room/object-defs.js';
import { createRoomObjectPreviewEngine, RoomObjectPreviewEngine } from '@/world/room/previewEngine.js';
import { camelToKebab } from '@/world/utility.js';

const emit = defineEmits<{
	(ev: 'ok', id: string): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');
const canvas = useTemplateRef('canvas');
const selectedId = ref<string | null>(null);
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
	if (newId == null) return;
	engine.value!.load(newId);
});

function ok() {
	if (selectedId.value == null) return;
	emit('ok', selectedId.value);
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
	height: 100%;
	overflow-y: scroll;
}

.catalogItem {
	padding: 8px;
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
	height: auto;
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
}

.canvas {
	width: 100%;
	height: 100%;
	display: block;
}

.unselectButton {
	position: absolute;
	top: 8px;
	right: 8px;

}
</style>
