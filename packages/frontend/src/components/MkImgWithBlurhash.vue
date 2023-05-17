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
import { $ref } from 'vue/macros';

const WEBGL2_IN_OFFSCREENCANVAS_SUPPORTED = (() => {
	const canvas = new OffscreenCanvas(1, 1);
	const gl = canvas.getContext('webgl2');
	if (_DEV_) console.info('WEBGL2_IN_OFFSCREENCANVAS_SUPPORTED', !!gl);
	return !!gl;
})();
</script>

<script lang="ts" setup>
import { computed, nextTick, onMounted, shallowRef, useCssModule, watch } from 'vue';
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

const canvas = shallowRef<HTMLCanvasElement>();
const root = shallowRef<HTMLDivElement>();
const img = shallowRef<HTMLImageElement>();
let loaded = $ref(false);
let canvasWidth = $ref(64);
let canvasHeight = $ref(64);
let imgWidth = $ref(props.width);
let imgHeight = $ref(props.height);
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

// アクティブなwebgl2をたくさん持てないため、burahaは別のcanvasで描画させる
// ImageBitmapで送るのは、なるべく早くwebgl2コンテキストを持ったcanvasを解放させるため
async function drawSub(): Promise<ImageBitmap | void> {
	if (props.hash == null) return;

	if (WEBGL2_IN_OFFSCREENCANVAS_SUPPORTED) {
		const work = new OffscreenCanvas(canvasWidth, canvasHeight);
		render(props.hash, work);
		return createImageBitmap(work);
	}

	const work = document.createElement('canvas');
	work.width = canvasWidth;
	work.height = canvasHeight;
	render(props.hash, work);
	return createImageBitmap(work);
}

async function draw() {
	if (!canvas.value || props.hash == null) return;
	const ctx = canvas.value.getContext('2d');

	if (!ctx) {
		console.error('Unable to get canvas 2D context');
		return;
	}

	try {
		const bitmap = await drawSub();
		if (!bitmap) return;
		ctx.drawImage(bitmap, 0, 0, canvasWidth, canvasHeight);
	} catch (error) {
		console.error('Error occured during drawing blurhash', error);
	}
}

watch(() => props.src, () => {
	waitForDecode();
});

watch(() => props.hash, () => {
	draw();
});

onMounted(() => {
	draw();
	waitForDecode();
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
