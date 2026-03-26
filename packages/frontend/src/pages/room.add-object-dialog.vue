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

	<div :class="$style.container">
		<div>
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
</MkModalWindow>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch, onMounted, onUnmounted, reactive, nextTick } from 'vue';
import { i18n } from '@/i18n.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import * as os from '@/os.js';
import { OBJECT_DEFS } from '@/utility/room/object-defs.js';

const emit = defineEmits<{
	(ev: 'ok', id: string): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');
const canvas = useTemplateRef('canvas');
const selectedId = ref<string | null>(null);

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
.container {
	height: 100%;
	display: grid;
	grid-template-columns: 1fr 400px;
}

.catalogItem {
	padding: 8px;
	border: 1px solid var(--border-color);
	border-radius: 4px;
	cursor: pointer;
}
.selected {
	background-color: var(--accent-color);
	color: var(--accent-text-color);
}

.canvas {
	width: 100%;
	height: 100%;
	display: block;
	background: #000;
}
</style>
