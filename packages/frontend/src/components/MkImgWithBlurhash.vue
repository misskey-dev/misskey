<template>
<div :class="[$style.root, { [$style.cover]: cover }]" :title="title ?? ''">
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
		<img v-show="!hide" key="img" :height="height" :width="width" :class="$style.img" :src="src ?? undefined" :title="title ?? undefined" :alt="alt ?? undefined" loading="eager" @load="onLoad"/>
	</TransitionGroup>
</div>
</template>
<script lang="ts">
import DrawBlurhash from '@/workers/draw-blurhash?worker';
import TestWebGL2 from '@/workers/test-webgl2?worker';

const workerPromise = new Promise<Worker | null>(resolve => {
	const testWorker = new TestWebGL2();
	testWorker.addEventListener('message', event => {
		if (event.data.result) resolve(new DrawBlurhash());
		else resolve(null);
		testWorker.terminate();
	});
});
</script>
<script lang="ts" setup>
import { computed, onMounted, onUnmounted, shallowRef, useCssModule, watch } from 'vue';
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
let loaded = $ref(false);
let canvasWidth = $ref(props.width);
let canvasHeight = $ref(props.height);
const hide = computed(() => !loaded || props.forceBlurhash);

function onLoad() {
	loaded = true;
}

watch([() => props.width, () => props.height], () => {
	const ratio = props.width / props.height;
	if (ratio > 1) {
		canvasWidth = Math.round(64 * ratio);
		canvasHeight = 64;
	} else {
		canvasWidth = 64;
		canvasHeight = Math.round(64 / ratio);
	}
}, {
	immediate: true,
});

async function draw(transfer: boolean = false) {
	if (!canvas.value || props.hash == null) return;
	const worker = await workerPromise;
	if (worker) {
		let offscreen: OffscreenCanvas | undefined;
		if (transfer) {
			offscreen = canvas.value.transferControlToOffscreen();
		}
		worker.postMessage({
			id: viewId,
			canvas: offscreen ?? undefined,
			hash: props.hash,
		}, offscreen ? [offscreen] : []);
	} else {
		try {
			const work = document.createElement('canvas');
			work.width = canvasWidth;
			work.height = canvasHeight;
			render(props.hash, work);
			const bitmap = await createImageBitmap(work);
			const ctx = canvas.value.getContext('2d');
			ctx?.drawImage(bitmap, 0, 0, canvasWidth, canvasHeight);
		} catch (error) {
			console.error('Error occured during drawing blurhash', error);
		}
	}
}

watch(() => props.hash, () => {
	draw();
});

onMounted(() => {
	draw(true);
});

onUnmounted(() => {
	workerPromise.then(worker => worker?.postMessage!({ id: viewId, delete: true }));
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
