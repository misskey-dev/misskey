<template>
<div ref="root" :class="[$style.root, { [$style.cover]: cover }]" :title="title ?? ''">
	<TransitionGroup
		:duration="defaultStore.state.animation && props.transition?.duration || undefined"
		:enter-active-class="defaultStore.state.animation && props.transition?.enterActiveClass || undefined"
		:leave-active-class="defaultStore.state.animation && (props.transition?.leaveActiveClass ?? $style['transition_leaveActive']) || undefined"
		:enter-from-class="defaultStore.state.animation && props.transition?.enterFromClass || undefined"
		:leave-to-class="defaultStore.state.animation && props.transition?.leaveToClass || undefined"
		:enter-to-class="defaultStore.state.animation && props.transition?.enterToClass || undefined"
		:leave-from-class="defaultStore.state.animation && props.transition?.leaveFromClass || undefined"
	>
		<canvas v-show="hide" key="canvas" ref="canvas" :class="$style.canvas" :width="canvasWidth" :height="canvasHeight" :title="title ?? undefined"/>
		<img v-show="!hide" key="img" ref="img" :height="imgHeight" :width="imgWidth" :class="$style.img" :src="src ?? undefined" :title="title ?? undefined" :alt="alt ?? undefined" loading="eager" decoding="async"/>
	</TransitionGroup>
</div>
</template>

<script lang="ts">
import DrawBlurhash from '@/workers/draw-blurhash?worker';
import TestWebGL2 from '@/workers/test-webgl2?worker';

const workerPromise = new Promise<Worker | null>(resolve => {
	const testWorker = new TestWebGL2();
	testWorker.addEventListener('message', event => {
		if (event.data.result) {
			console.log('WebGL2 is supported in worker.')
			resolve(new DrawBlurhash());
		} else {
			console.log('WebGL2 is not supported in worker.')
			resolve(null);
		}
		testWorker.terminate();
	});
});
</script>

<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, shallowRef, useCssModule, watch } from 'vue';
import { v4 as uuid } from 'uuid';
import { render } from 'buraha';
import { defaultStore } from '@/store';
const $style = useCssModule();

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
	hash?: string;
	alt?: string | null;
	title?: string | null;
	height?: number;
	width?: number;
	cover?: boolean;
	forceBlurhash?: boolean;
}>(), {
	transition: null,
	src: null,
	alt: '',
	title: null,
	height: 64,
	width: 64,
	cover: true,
	forceBlurhash: false,
});

const viewId = uuid();
const canvas = shallowRef<HTMLCanvasElement>();
const root = shallowRef<HTMLDivElement>();
const img = shallowRef<HTMLImageElement>();
let loaded = $ref(false);
let canvasWidth = $ref(64);
let canvasHeight = $ref(64);
let imgWidth = $ref(props.width);
let imgHeight = $ref(props.height);
let bitmapTmp = $ref<ImageBitmap | undefined>();
const hide = computed(() => !loaded || props.forceBlurhash);

function waitForDecode() {
	if (props.src != null && props.src !== '') {
		nextTick()
			.then(() => img.value?.decode())
			.then(() => {
				loaded = true;
			}, error => {
				console.error('Error occured during decoding image', img.value, error);
				throw Error(error);
			});
	} else {
		loaded = false;
	}
}

watch([() => props.width, () => props.height, root], () => {
	const ratio = props.width / props.height;
	if (ratio > 1) {
		canvasWidth = Math.round(64 * ratio);
		canvasHeight = 64;
	} else {
		canvasWidth = 64;
		canvasHeight = Math.round(64 / ratio);
	}

	const clientWidth = root.value?.clientWidth ?? 300;
	imgWidth = clientWidth;
	imgHeight = Math.round(clientWidth / ratio);
}, {
	immediate: true,
});

function drawImage(bitmap: CanvasImageSource) {
	// canvasがない（mountedされていない）場合はTmpに保存しておく
	if (!canvas.value) {
		bitmapTmp = bitmap;
		return;
	}

	bitmapTmp = undefined;

	// canvasがあったらすぐに描画する
	const ctx = canvas.value.getContext('2d');
	if (!ctx) return;
	ctx.drawImage(bitmap, 0, 0, canvasWidth, canvasHeight);
}

async function draw() {
	if (!canvas.value || props.hash == null) return;
	const worker = await workerPromise;
	if (worker) {
		worker.postMessage({
			id: viewId,
			hash: props.hash,
		});
	} else {
		try {
			const work = document.createElement('canvas');
			work.width = canvasWidth;
			work.height = canvasHeight;
			render(props.hash, work);
			const bitmap = await createImageBitmap(work);
			drawImage(bitmap);
		} catch (error) {
			console.error('Error occured during drawing blurhash', error);
		}
	}
}

function workerOnMessage(event: MessageEvent) {
	if (event.data.id !== viewId) return;
	drawImage(event.data.bitmap as ImageBitmap);
}

workerPromise.then(worker => {
	if (worker) {
		worker.addEventListener('message', workerOnMessage);
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
	if (bitmapTmp) {
		drawImage(bitmapTmp);
	}
});

onUnmounted(() => {
	workerPromise.then(worker => {
		if (worker) {
			worker.removeEventListener('message', workerOnMessage);
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
