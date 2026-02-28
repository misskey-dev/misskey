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
	:okButtonDisabled="!canSave"
	@close="cancel()"
	@ok="save()"
	@closed="emit('closed')"
>
	<template #header><i class="ti ti-icons"></i> {{ i18n.ts._widgets[widgetName] ?? widgetName }}</template>

	<MkPreviewWithControls>
		<template #preview>
			<div :class="$style.previewWrapper">
				<div class="_acrylic" :class="$style.previewTitle">{{ i18n.ts.preview }}</div>

				<div ref="resizerRootEl" :class="$style.previewResizerRoot" inert>
					<div
						ref="resizerEl"
						:class="$style.previewResizer"
						:style="{ transform: widgetStyle }"
					>
						<component
							:is="`widget-${widgetName}`"
							:widget="{ name: widgetName, id: '__PREVIEW__', data: settings }"
						></component>
					</div>
				</div>
			</div>
		</template>

		<template #controls>
			<div class="_spacer">
				<MkForm v-model="settings" :form="form" @canSaveStateChange="onCanSaveStateChanged"/>
			</div>
		</template>
	</MkPreviewWithControls>
</MkModalWindow>
</template>

<script setup lang="ts">
import { useTemplateRef, ref, computed, onBeforeUnmount, onMounted } from 'vue';
import MkPreviewWithControls from './MkPreviewWithControls.vue';
import type { Form } from '@/utility/form.js';
import type { WidgetName } from '@/widgets/index.js';
import { deepClone } from '@/utility/clone.js';
import { i18n } from '@/i18n.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkForm from '@/components/MkForm.vue';

const props = defineProps<{
	widgetName: WidgetName;
	form: Form;
	currentSettings: Record<string, any>;
}>();

const emit = defineEmits<{
	(ev: 'saved', settings: Record<string, any>): void;
	(ev: 'canceled'): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

const settings = ref<Record<string, any>>(deepClone(props.currentSettings));

const canSave = ref(true);

function onCanSaveStateChanged(newCanSave: boolean) {
	canSave.value = newCanSave;
}

function save() {
	if (!canSave.value) return;
	emit('saved', deepClone(settings.value));
	dialog.value?.close();
}

function cancel() {
	emit('canceled');
	dialog.value?.close();
}

//#region プレビューのリサイズ
const resizerRootEl = useTemplateRef('resizerRootEl');
const resizerEl = useTemplateRef('resizerEl');
const widgetHeight = ref(0);
const widgetScale = ref(1);
const widgetStyle = computed(() => {
	return `translate(-50%, -50%) scale(${widgetScale.value})`;
});
const ro1 = new ResizeObserver(() => {
	widgetHeight.value = resizerEl.value!.clientHeight;
	calcScale();
});
const ro2 = new ResizeObserver(() => {
	calcScale();
});

function calcScale() {
	if (!resizerRootEl.value) return;
	const previewWidth = resizerRootEl.value.clientWidth - 40; // 左右の余白 20pxずつ
	const previewHeight = resizerRootEl.value.clientHeight - 40; // 上下の余白 20pxずつ
	const widgetWidth = 280;
	const scale = Math.min(previewWidth / widgetWidth, previewHeight / widgetHeight.value, 1); // 拡大はしないので1を上限に
	widgetScale.value = scale;
}

onMounted(() => {
	if (resizerEl.value) {
		ro1.observe(resizerEl.value);
	}
	if (resizerRootEl.value) {
		ro2.observe(resizerRootEl.value);
	}
	calcScale();
});

onBeforeUnmount(() => {
	ro1.disconnect();
	ro2.disconnect();
});
//#endregion
</script>

<style module>
.previewContainer {
	display: flex;
	flex-direction: column;
	height: 100%;
	user-select: none;
	-webkit-user-drag: none;
}

.previewTitle {
	position: absolute;
	z-index: 100;
	top: 8px;
	left: 8px;
	padding: 6px 10px;
	border-radius: 6px;
	font-size: 85%;
}

.previewWrapper {
	display: flex;
	flex-direction: column;
	height: 100%;
	pointer-events: none;
	user-select: none;
	-webkit-user-drag: none;
}

.previewResizerRoot {
	position: relative;
	flex: 1 0;
}

.previewResizer {
	position: absolute;
	container-type: inline-size;
	top: 50%;
	left: 50%;
	width: 280px;
}
</style>
