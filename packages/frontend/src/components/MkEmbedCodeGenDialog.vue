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
	@ok="ok()"
	@closed="$emit('closed')"
>
	<template #header>{{ i18n.ts._embedCodeGen.title }}</template>

	<div :class="$style.embedCodeGenRoot">
		<div :class="$style.embedCodeGenWrapper">
			<div
				:class="$style.embedCodeGenPreviewRoot"
			>
				<MkLoading v-if="iframeLoading" :class="$style.embedCodeGenPreviewSpinner"/>
				<div :class="$style.embedCodeGenPreviewWrapper">
					<div :class="$style.embedCodeGenPreviewTitle">{{ i18n.ts.preview }}</div>
					<div ref="resizerRootEl" :class="$style.embedCodeGenPreviewResizerRoot">
						<div
							:class="$style.embedCodeGenPreviewResizer"
							:style="{ transform: iframeStyle }"
						>
							<iframe
								ref="iframeEl"
								:src="embedPreviewUrl"
								:class="$style.embedCodeGenPreviewIframe"
								:style="{ height: `${iframeHeight}px` }"
								@load="iframeOnLoad"
							></iframe>
						</div>
					</div>
				</div>
			</div>
			<div :class="$style.embedCodeGenSettings" class="_gaps">
				<MkInput v-if="isEmbedWithScrollbar" v-model="maxHeight" type="number" :min="0">
					<template #label>{{ i18n.ts._embedCodeGen.maxHeight }}</template>
					<template #suffix>px</template>
					<template #caption>{{ i18n.ts._embedCodeGen.maxHeightDescription }}</template>
				</MkInput>
				<MkSelect v-model="colorMode">
					<template #label>{{ i18n.ts.theme }}</template>
					<option value="auto">{{ i18n.ts.syncDeviceDarkMode }}</option>
					<option value="light">{{ i18n.ts.light }}</option>
					<option value="dark">{{ i18n.ts.dark }}</option>
				</MkSelect>
				<MkSwitch v-if="isEmbedWithScrollbar" v-model="header">{{ i18n.ts._embedCodeGen.header }}</MkSwitch>
				<MkSwitch v-if="isEmbedWithScrollbar" v-model="autoload">{{ i18n.ts._embedCodeGen.autoload }}</MkSwitch>
				<MkSwitch v-model="rounded">{{ i18n.ts._embedCodeGen.rounded }}</MkSwitch>
				<MkSwitch v-model="border">{{ i18n.ts._embedCodeGen.border }}</MkSwitch>
				<MkInfo v-if="isEmbedWithScrollbar && (!maxHeight || maxHeight <= 0)" warn>{{ i18n.ts._embedCodeGen.maxHeightWarn }}</MkInfo>
				<MkInfo v-if="typeof maxHeight === 'number' && (maxHeight <= 0 || maxHeight > 700)">{{ i18n.ts._embedCodeGen.previewIsNotActual }}</MkInfo>
				<div class="_buttons">
					<MkButton :disabled="iframeLoading" @click="applyToPreview">{{ i18n.ts._embedCodeGen.applyToPreview }}</MkButton>
				</div>
			</div>
		</div>
	</div>
</MkModalWindow>
</template>

<script setup lang="ts">
import { shallowRef, ref, computed, nextTick, onMounted, onDeactivated, onUnmounted } from 'vue';
import MkModalWindow from '@/components/MkModalWindow.vue';

import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';

import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { url } from '@/config.js';
import copy from '@/scripts/copy-to-clipboard.js';
import { normalizeEmbedParams, getEmbedCode } from '@/scripts/get-embed-code.js';
import { embedRouteWithScrollbar } from '@/scripts/embed-page.js';
import type { EmbeddableEntity, EmbedParams } from '@/scripts/embed-page.js';

const emit = defineEmits<{
	(ev: 'ok', url: string, code: string): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const props = withDefaults(defineProps<{
	entity: EmbeddableEntity;
	idOrUsername: string;
	params?: EmbedParams;
	doCopy?: boolean;
}>(), {
	doCopy: true,
});

//#region Modalの制御
const dialogEl = shallowRef<InstanceType<typeof MkModalWindow>>();

function cancel() {
	emit('cancel');
	dialogEl.value?.close();
}

function ok() {
	const _idOrUsername = props.entity === 'user-timeline' ? '@' + props.idOrUsername : props.idOrUsername;
	const generatedUrl = `${url}/embed/${props.entity}/${_idOrUsername}?${new URLSearchParams(normalizeEmbedParams(paramsForUrl.value)).toString()}`;
	const generatedCode = getEmbedCode(`/embed/${props.entity}/${_idOrUsername}`, paramsForUrl.value);
	if (props.doCopy) {
		copy(generatedCode);
		os.success();
	}
	emit('ok', generatedUrl, generatedCode);
	dialogEl.value?.close();
}
//#endregion

//#region 埋め込みURL生成・カスタマイズ

// 本URL生成用params
const paramsForUrl = computed<EmbedParams>(() => ({
	header: header.value,
	autoload: autoload.value,
	maxHeight: typeof maxHeight.value === 'number' ? Math.max(0, maxHeight.value) : undefined,
	colorMode: colorMode.value === 'auto' ? undefined : colorMode.value,
	rounded: rounded.value,
	border: border.value,
}));

// プレビュー用params（手動で更新を掛けるのでref）
const paramsForPreview = ref<EmbedParams>(props.params ?? {});

const embedPreviewUrl = computed(() => {
	const _idOrUsername = props.entity === 'user-timeline' ? '@' + props.idOrUsername : props.idOrUsername;
	const paramClass = new URLSearchParams(normalizeEmbedParams(paramsForPreview.value));
	if (paramClass.has('maxHeight')) {
		const maxHeight = parseInt(paramClass.get('maxHeight')!);
		paramClass.set('maxHeight', maxHeight === 0 ? '500' : Math.min(maxHeight, 700).toString()); // プレビューであまりにも縮小されると見づらいため、700pxまでに制限
	}
	return `${url}/embed/${props.entity}/${_idOrUsername}${paramClass.toString() ? '?' + paramClass.toString() : ''}`;
});

const isEmbedWithScrollbar = computed(() => embedRouteWithScrollbar.includes(props.entity));
const header = ref(props.params?.header ?? true);
const autoload = ref(props.params?.autoload ?? false);
const maxHeight = ref(props.params?.maxHeight !== 0 ? props.params?.maxHeight ?? undefined : 500);

const colorMode = ref<'light' | 'dark' | 'auto'>(props.params?.colorMode ?? 'auto');
const rounded = ref(props.params?.rounded ?? true);
const border = ref(props.params?.border ?? true);

function applyToPreview() {
	const currentPreviewUrl = embedPreviewUrl.value;

	paramsForPreview.value = {
		header: header.value,
		autoload: false, // プレビューはスクロールできないので常にfalse
		maxHeight: typeof maxHeight.value === 'number' ? Math.max(0, maxHeight.value) : undefined,
		colorMode: colorMode.value === 'auto' ? undefined : colorMode.value,
		rounded: rounded.value,
		border: border.value,
	};

	nextTick(() => {
		if (currentPreviewUrl === embedPreviewUrl.value) {
			// URLが変わらなくてもリロード
			iframeEl.value?.contentWindow?.location.reload();
		}
	});
}
//#endregion

//#region プレビューのリサイズ
const resizerRootEl = shallowRef<HTMLDivElement>();
const iframeLoading = ref(true);
const iframeEl = shallowRef<HTMLIFrameElement>();
const iframeHeight = ref(0);
const iframeScale = ref(1);
const iframeStyle = computed(() => {
	return `translate(-50%, -50%) scale(${iframeScale.value})`;
});
const resizeObserver = new ResizeObserver(() => {
	calcScale();
});

function iframeOnLoad() {
	iframeEl.value?.contentWindow?.addEventListener('beforeunload', () => {
		iframeLoading.value = true;
		nextTick(() => {
			iframeHeight.value = 0;
			iframeScale.value = 1;
		});
	});
}

function windowEventHandler(event: MessageEvent) {
	if (event.source !== iframeEl.value?.contentWindow) {
		return;
	}
	if (event.data.type === 'misskey:embed:ready') {
		iframeEl.value!.contentWindow?.postMessage({
			type: 'misskey:embedParent:registerIframeId',
			payload: {
				iframeId: 'embedCodeGen', // 同じタイミングで複数のembed iframeがある際の区別用なのでここではなんでもいい
			},
		});
	}
	if (event.data.type === 'misskey:embed:changeHeight') {
		iframeHeight.value = event.data.payload.height;
		nextTick(() => {
			calcScale();
			iframeLoading.value = false; // 初回の高さ変更まで待つ
		});
	}
}

function calcScale() {
	if (!resizerRootEl.value) return;
	const previewWidth = resizerRootEl.value.clientWidth - 40; // 左右の余白 20pxずつ
	const previewHeight = resizerRootEl.value.clientHeight - 40; // 上下の余白 20pxずつ（プレビューの文字は28px）
	const iframeWidth = 500;
	const scale = Math.min(previewWidth / iframeWidth, previewHeight / iframeHeight.value, 1); // 拡大はしない
	iframeScale.value = scale;
}

onMounted(() => {
	window.addEventListener('message', windowEventHandler);
	if (!resizerRootEl.value) return;
	resizeObserver.observe(resizerRootEl.value);
});

onDeactivated(() => {
	window.removeEventListener('message', windowEventHandler);
	resizeObserver.disconnect();
});

onUnmounted(() => {
	window.removeEventListener('message', windowEventHandler);
	resizeObserver.disconnect();
});
//#endregion
</script>

<style module>
.embedCodeGenRoot {
	container-type: inline-size;
	height: 100%;
}

.embedCodeGenWrapper {
	height: 100%;
	display: grid;
	grid-template-columns: 1fr 400px;
}

.embedCodeGenPreviewRoot {
	position: relative;
	background-color: var(--bg);
	cursor: not-allowed;
}

.embedCodeGenPreviewWrapper {
	display: flex;
	flex-direction: column;
	height: 100%;
	pointer-events: none;
	user-select: none;
	-webkit-user-drag: none;
}

.embedCodeGenPreviewTitle {
	width: fit-content;
	flex-shrink: 0;
	padding: 0 8px;
	background-color: var(--panel);
	border-right: 1px solid var(--divider);
	border-bottom: 1px solid var(--divider);
	border-bottom-right-radius: var(--radius);
	height: 28px;
	line-height: 28px;
	box-sizing: border-box;
}

.embedCodeGenPreviewSpinner {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	pointer-events: none;
	user-select: none;
	-webkit-user-drag: none;
}

.embedCodeGenPreviewResizerRoot {
	position: relative;
	flex: 1 0;
}

.embedCodeGenPreviewResizer {
	position: absolute;
	top: 50%;
	left: 50%;
}

.embedCodeGenPreviewIframe {
	border: none;
	width: 500px;
	color-scheme: light dark;
}

.embedCodeGenSettings {
	padding: 24px;
	overflow-y: scroll;
}

@container (max-width: 800px) {
	.embedCodeGenWrapper {
		grid-template-columns: 1fr;
		grid-template-rows: 1fr 1fr;
	}
}
</style>
