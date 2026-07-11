<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<canvas
	v-show="show"
	ref="canvas"
	:width="canvasWidth"
	:height="canvasHeight"
	draggable="false"
	tabindex="-1"
	style="-webkit-user-drag: none;"
></canvas>
</template>

<script lang="ts">
import DrawBlurhash from '@/workers/draw-blurhash?worker';
import TestWebGL2 from '@/workers/test-webgl2?worker';
import { WorkerMultiDispatch } from '@@/js/worker-multi-dispatch.js';

// テスト環境で Web Worker インスタンスは作成できない
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const isTest = (import.meta.env.MODE === 'test' || window.isPlaywright);

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
import { watch, ref, shallowRef, useTemplateRef, onMounted, onUnmounted } from 'vue';
import { genId } from '@/utility/id.js';
import { extractAvgColorFromBlurhash } from '@@/js/extract-avg-color-from-blurhash.js';

const props = withDefaults(defineProps<{
	blurhash: string | null;
	onlyAvgColor?: boolean;
	width?: number;
	height?: number;
	// v-showが何故か動作しないため
	show?: boolean;
}>(), {
	onlyAvgColor: false,
	width: 64,
	height: 64,
	show: true,
});

const canvas = useTemplateRef('canvas');
const canvasWidth = ref(64);
const canvasHeight = ref(64);
const viewId = genId();
const bitmapTmp = shallowRef<CanvasImageSource | undefined>();

watch([() => props.width, () => props.height, canvas], () => {
	const ratio = props.width / props.height;
	if (ratio > 1) {
		canvasWidth.value = Math.round(64 * ratio);
		canvasHeight.value = 64;
	} else {
		canvasWidth.value = 64;
		canvasHeight.value = Math.round(64 / ratio);
	}
}, {
	immediate: true,
});

watch(() => props.blurhash, () => {
	draw();
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

	const color = (props.blurhash != null && extractAvgColorFromBlurhash(props.blurhash)) || '#888';

	const ctx = canvas.value.getContext('2d');
	if (!ctx) return;

	// avgColorでお茶をにごす
	ctx.beginPath();
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
}

async function draw() {
	if (isTest && props.blurhash == null) return;

	drawAvg();

	if (props.blurhash == null) return;

	if (props.onlyAvgColor) return;

	const work = await canvasPromise;
	if (work instanceof WorkerMultiDispatch) {
		work.postMessage(
			{
				id: viewId,
				hash: props.blurhash,
			},
			undefined,
		);
	} else {
		try {
			const { render } = await import('buraha');
			render(props.blurhash, work);
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

onMounted(() => {
	// drawImageがmountedより先に呼ばれている場合はここで描画する
	if (bitmapTmp.value) {
		drawImage(bitmapTmp.value);
	}
});

onUnmounted(() => {
	canvasPromise.then(work => {
		if (work instanceof WorkerMultiDispatch) {
			work.removeListener(workerOnMessage);
		}
	});
});
</script>
