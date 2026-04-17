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
		<div :class="$style.container">
			<div :class="$style.menu">
				<div
					v-for="def in OBJECT_DEFS"
					:key="def.id"
					:class="[$style.catalogItem, { [$style.selected]: selectedId === def.id }]"
					@click="selectedId = def.id"
				>
					<div>{{ def.name }}</div>
				</div>
			</div>
			<canvas ref="canvas" :class="$style.canvas"></canvas>
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
import { createRoomObjectPreviewEngine, RoomObjectPreviewEngine } from '@/world/room/engine.js';

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
}

.container {
	height: 100%;
	display: grid;
	grid-template-columns: 400px 1fr;
}

.menu {
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

.canvas {
	width: 100%;
	height: 100%;
	display: block;
	background: #000;
}
</style>
