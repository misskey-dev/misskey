<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<MkModalWindow
		ref="dialogEl"
		:width="400"
		:height="500"
		:withOkButton="true"
		:okButtonDisabled="false"
		@click="cancel"
		@close="cancel"
		@ok="ok"
	>
		<template #header>カラーピッカー</template>
		<div :class="$style.root">
			<div ref="pickerEl" :class="$style.picker"></div>
			<div :class="$style.preview">
				<div :class="$style.previewColor" :style="{ background: selectedColor }"></div>
				<div :class="$style.previewHex">{{ selectedColor }}</div>
			</div>
		</div>
	</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, shallowRef, onMounted, onBeforeUnmount } from 'vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import iro from '@jaames/iro';

const props = defineProps<{
	currentColor: string;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
	(ev: 'ok', result: string): void;
}>();

const dialogEl = shallowRef<InstanceType<typeof MkModalWindow>>();
const pickerEl = ref<HTMLElement>();
const selectedColor = ref(props.currentColor);
let colorPicker: iro.ColorPicker | null = null;

onMounted(() => {
	if (!pickerEl.value) return;

	// iro.jsカラーピッカーを初期化
	colorPicker = iro.ColorPicker(pickerEl.value, {
		width: 320,
		color: props.currentColor,
		borderWidth: 1,
		borderColor: '#fff',
		layout: [
			{
				component: iro.ui.Wheel,
				options: {}
			},
			{
				component: iro.ui.Slider,
				options: {
					sliderType: 'value'
				}
			}
		]
	});

	// 色変更イベント
	colorPicker.on('color:change', (color: iro.Color) => {
		selectedColor.value = color.hexString.toUpperCase();
	});
});

onBeforeUnmount(() => {
	if (colorPicker) {
		colorPicker = null;
	}
});

function ok() {
	emit('ok', selectedColor.value);
	dialogEl.value?.close();
}

function cancel() {
	emit('closed');
	dialogEl.value?.close();
}
</script>

<style lang="scss" module>
.root {
	padding: 20px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 20px;
}

.picker {
	width: 320px;
	height: auto;
}

.preview {
	display: flex;
	align-items: center;
	gap: 12px;
	width: 100%;
	padding: 12px;
	background: var(--MI_THEME-panel);
	border-radius: 8px;
}

.previewColor {
	width: 48px;
	height: 48px;
	border-radius: 8px;
	border: 2px solid var(--MI_THEME-divider);
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.previewHex {
	flex: 1;
	font-size: 18px;
	font-weight: bold;
	font-family: 'Courier New', monospace;
	color: var(--MI_THEME-fg);
}
</style>
