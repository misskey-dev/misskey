<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="root" :class="['chromatic-ignore', $style.root, { [$style.cover]: cover }]" :title="title ?? ''">
	<TransitionGroup
		:duration="prefer.s.animation && props.transition?.duration || undefined"
		:enterActiveClass="prefer.s.animation && props.transition?.enterActiveClass || undefined"
		:leaveActiveClass="prefer.s.animation && (props.transition?.leaveActiveClass ?? $style.transition_leaveActive) || undefined"
		:enterFromClass="prefer.s.animation && props.transition?.enterFromClass || undefined"
		:leaveToClass="prefer.s.animation && props.transition?.leaveToClass || undefined"
		:enterToClass="prefer.s.animation && props.transition?.enterToClass || undefined"
		:leaveFromClass="prefer.s.animation && props.transition?.leaveFromClass || undefined"
	>
		<canvas
			v-show="hide"
			key="canvas"
			ref="canvas"
			:class="$style.canvas"
			:width="canvasWidth"
			:height="canvasHeight"
			:title="title ?? undefined"
			draggable="false"
			tabindex="-1"
			style="-webkit-user-drag: none;"
		></canvas>
		<img
			v-show="!hide"
			key="img"
			ref="img"
			:height="imgHeight ?? undefined"
			:width="imgWidth ?? undefined"
			:class="$style.img"
			:src="src ?? undefined"
			:title="title ?? undefined"
			:alt="alt ?? undefined"
			loading="eager"
			decoding="async"
			draggable="false"
			tabindex="-1"
			style="-webkit-user-drag: none;"
		/>
	</TransitionGroup>
</div>
</template>

<script lang="ts">
import DrawBlurhash from '@/workers/draw-blurhash?worker';
import TestWebGL2 from '@/workers/test-webgl2?worker';
import { WorkerMultiDispatch } from '@@/js/worker-multi-dispatch.js';
import { extractAvgColorFromBlurhash } from '@@/js/extract-avg-color-from-blurhash.js';

// テスト環境で Web Worker インスタンスは作成できない
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const isTest = (import.meta.env.MODE === 'test' || window.Cypress != null);

const canvasPromise = new Promise<WorkerMultiDispatch | HTMLCanvasElement>(resolve => {
	if (isTest) {
		const canvas = window.document.createElement('canvas');
		canvas.width = 64;
		canvas.height = 64;
		resolve(canvas);
		return;
	}

	const testWorker = new TestWebGL2();
	testWorker.addEventListener('message', event => {
		if (event.data.result) {
			const workers = new WorkerMultiDispatch(
				() => new DrawBlurhash(),
				Math.min(navigator.hardwareConcurrency - 1, 4),
			);
			resolve(workers);
		} else {
			const canvas = window.document.createElement('canvas');
			canvas.width = 64;
			canvas.height = 64;
			resolve(canvas);
		}
		testWorker.terminate();
	});
});
</script>

<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, useTemplateRef, watch, ref } from 'vue';
import { genId } from '@/utility/id.js';
import { render } from 'buraha';
import { prefer } from '@/preferences.js';

const props = withDefaults(defineProps<{
	transition?: {
		duration?: number | { enter: number; leave: number; };
		enterActiveClass?: string;
		leaveActiveClass?: string;
		enterFromClass?: string;
		leaveToClass?: string;
		enterToClass?: string;
		leaveFromClass?: string;
	} | null;
	src?: string | null;
	hash?: string | null;
	alt?: string | null;
	title?: string | null;
	height?: number;
	width?: number;
	cover?: boolean;
	forceBlurhash?: boolean;
	onlyAvgColor?: boolean; // 軽量化のためにBlurhashを使わずに平均色だけを描画
}>(), {
	transition: null,
	src: null,
	alt: '',
	title: null,
	height: 64,
	width: 64,
	cover: true,
	forceBlurhash: false,
	onlyAvgColor: false,
});

const viewId = genId();
const canvas = useTemplateRef('canvas');
const root = useTemplateRef('root');
const img = useTemplateRef('img');
const loaded = ref(false);
const canvasWidth = ref(64);
const canvasHeight = ref(64);
const imgWidth = ref(props.width);
const imgHeight = ref(props.height);
const bitmapTmp = ref<CanvasImageSource | undefined>();
const hide = computed(() => !loaded.value || props.forceBlurhash);

function waitForDecode() {
	if (props.src != null && props.src !== '') {
		nextTick()
			.then(() => img.value?.decode())
			.then(() => {
				loaded.value = true;
			}, error => {
				console.log('Error occurred during decoding image', img.value, error);
			});
	} else {
		loaded.value = false;
	}
}

watch([() => props.width, () => props.height, root], () => {
	const ratio = props.width / props.height;
	if (ratio > 1) {
		canvasWidth.value = Math.round(64 * ratio);
		canvasHeight.value = 64;
	} else {
		canvasWidth.value = 64;
		canvasHeight.value = Math.round(64 / ratio);
	}

	const clientWidth = root.value?.clientWidth ?? 300;
	imgWidth.value = clientWidth;
	imgHeight.value = Math.round(clientWidth / ratio);
}, {
	immediate: true,
});

function drawImage(bitmap: CanvasImageSource) {
	// canvasがない（mountedされていない）場合はTmpに保存しておく
	if (!canvas.value) {
		bitmapTmp.value = bitmap;
		return;
	}

	// canvasがあれば描画する
	bitmapTmp.value = undefined;
	const ctx = canvas.value.getContext('2d');
	if (!ctx) return;
	ctx.drawImage(bitmap, 0, 0, canvasWidth.value, canvasHeight.value);
}

function drawAvg() {
	if (!canvas.value) return;

	const color = (props.hash != null && extractAvgColorFromBlurhash(props.hash)) || '#888';

	const ctx = canvas.value.getContext('2d');
	if (!ctx) return;

	// avgColorでお茶をにごす
	ctx.beginPath();
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
}

async function draw() {
	if (isTest && props.hash == null) return;

	drawAvg();

	if (props.hash == null) return;

	if (props.onlyAvgColor) return;

	const work = await canvasPromise;
	if (work instanceof WorkerMultiDispatch) {
		work.postMessage(
			{
				id: viewId,
				hash: props.hash,
			},
			undefined,
		);
	} else {
		try {
			render(props.hash, work);
			drawImage(work);
		} catch (error) {
			console.error('Error occurred during drawing blurhash', error);
		}
	}
}

function workerOnMessage(event: MessageEvent) {
	if (event.data.id !== viewId) return;
	drawImage(event.data.bitmap as ImageBitmap);
}

canvasPromise.then(work => {
	if (work instanceof WorkerMultiDispatch) {
		work.addListener(workerOnMessage);
	}

	draw();
});

watch(() => props.src, () => {
	waitForDecode();
});

watch(() => props.hash, () => {
	draw();
});

onMounted(() => {
	// drawImageがmountedより先に呼ばれている場合はここで描画する
	if (bitmapTmp.value) {
		drawImage(bitmapTmp.value);
	}
	waitForDecode();
});

onUnmounted(() => {
	canvasPromise.then(work => {
		if (work instanceof WorkerMultiDispatch) {
			work.removeListener(workerOnMessage);
		}
	});
});
</script>

<style lang="scss" module>
.transition_leaveActive {
	position: absolute;
	top: 0;
	left: 0;
}
.root {
	position: relative;
	width: 100%;
	height: 100%;

	&.cover {
		> .canvas,
		> .img {
			object-fit: cover;
		}
	}
}

.canvas,
.img {
	display: block;
	width: 100%;
	height: 100%;
}

.canvas {
	object-fit: contain;
}

.img {
	object-fit: contain;
}
</style>
