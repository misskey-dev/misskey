<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialogEl"
	:width="1000"
	:height="600"
	:scroll="false"
	:withOkButton="true"
	@close="cancel()"
	@ok="save()"
	@closed="emit('closed')"
>
	<template #header><i class="ti ti-ripple"></i> {{ i18n.ts.watermark }}</template>

	<div :class="$style.watermarkEditorRoot">
		<div :class="$style.watermarkEditorInputRoot">
			<div :class="$style.watermarkEditorPreviewRoot">
				<MkLoading v-if="canvasLoading" :class="$style.watermarkEditorPreviewSpinner"/>
				<canvas ref="canvas" :class="$style.watermarkEditorPreviewCanvas"></canvas>
				<div :class="$style.watermarkEditorPreviewWrapper">
					<div class="_acrylic" :class="$style.watermarkEditorPreviewTitle">{{ i18n.ts.preview }}</div>
				</div>
			</div>
			<div :class="$style.watermarkEditorSettings" class="_gaps">
				<MkSwitch v-model="useWatermark">
					<template #label>{{ i18n.ts.useWatermark }}</template>
					<template #caption>{{ i18n.ts.useWatermarkDescription }}</template>
				</MkSwitch>
			</div>
		</div>
	</div>
</MkModalWindow>
</template>

<script setup lang="ts">
import { shallowRef, ref, computed } from 'vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkSwitch from '@/components/MkSwitch.vue';

import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';

const emit = defineEmits<{
	(ev: 'ok'): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

//#region Modalの制御
const dialogEl = shallowRef<InstanceType<typeof MkModalWindow>>();

function cancel() {
	emit('cancel');
	dialogEl.value?.close();
}

function save() {
	emit('ok');
	dialogEl.value?.close();
}
//#endregion

//#region 設定
const useWatermark = computed(defaultStore.makeGetterSetter('useWatermark'));
const watermarkConfig = ref(defaultStore.state.watermarkConfig);
//#endregion

//#region Canvasの制御
const canvasLoading = ref(true);
//#endregion
</script>

<style module>
.transition_x_enterActive,
.transition_x_leaveActive {
	transition: opacity 0.3s cubic-bezier(0,0,.35,1), transform 0.3s cubic-bezier(0,0,.35,1);
}
.transition_x_enterFrom {
	opacity: 0;
	transform: translateX(50px);
}
.transition_x_leaveTo {
	opacity: 0;
	transform: translateX(-50px);
}

.watermarkEditorRoot {
	container-type: inline-size;
	height: 100%;
}

.watermarkEditorInputRoot {
	height: 100%;
	display: grid;
	grid-template-columns: 1fr 400px;
}

.watermarkEditorPreviewRoot {
	position: relative;
	background-color: var(--MI_THEME-bg);
	background-size: auto auto;
	background-image: repeating-linear-gradient(135deg, transparent, transparent 6px, var(--MI_THEME-panel) 6px, var(--MI_THEME-panel) 12px);
	cursor: not-allowed;
}

.watermarkEditorPreviewWrapper {
	display: flex;
	flex-direction: column;
	height: 100%;
	pointer-events: none;
	user-select: none;
	-webkit-user-drag: none;
}

.watermarkEditorPreviewTitle {
	position: absolute;
	z-index: 100;
	top: 8px;
	left: 8px;
	padding: 6px 10px;
	border-radius: 6px;
	font-size: 85%;
}

.watermarkEditorPreviewSpinner {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	pointer-events: none;
	user-select: none;
	-webkit-user-drag: none;
}

.watermarkEditorPreviewCanvas {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	padding: 20px;
	box-sizing: border-box;
	object-fit: contain;
}

.watermarkEditorSettings {
	padding: 24px;
	overflow-y: scroll;
}

.watermarkEditorResultRoot {
	box-sizing: border-box;
	padding: 24px;
	height: 100%;
	max-width: 700px;
	margin: 0 auto;
	display: flex;
	align-items: center;
}

.watermarkEditorResultHeading {
	text-align: center;
	font-size: 1.2em;
}

.watermarkEditorResultHeadingIcon {
	margin: 0 auto;
	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	text-align: center;
	height: 64px;
	width: 64px;
	font-size: 24px;
	line-height: 64px;
	border-radius: 50%;
}

.watermarkEditorResultDescription {
	text-align: center;
	white-space: pre-wrap;
}

.watermarkEditorResultWrapper,
.watermarkEditorResultCode {
	width: 100%;
}

.watermarkEditorResultButtons {
	margin: 0 auto;
}

@container (max-width: 800px) {
	.watermarkEditorInputRoot {
		grid-template-columns: 1fr;
		grid-template-rows: 1fr 1fr;
	}
}
</style>
