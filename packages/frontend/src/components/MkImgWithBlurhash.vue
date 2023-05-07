<template>
<div :class="[$style.root, { [$style.cover]: cover }]" :title="title ?? ''">
	<canvas ref="canvas" :class="$style.canvas" :width="canvasWidth" :height="canvasHeight" :title="title ?? undefined"/>
	<Transition
		:duration="defaultStore.state.animation && props.transition?.duration || undefined"
		:enter-active-class="defaultStore.state.animation && props.transition?.enterActiveClass || undefined"
		:leave-active-class="defaultStore.state.animation && props.transition?.leaveActiveClass || undefined"
		:enter-from-class="defaultStore.state.animation && props.transition?.enterFromClass || undefined"
		:leave-to-class="defaultStore.state.animation && props.transition?.leaveToClass || undefined"
		:enter-to-class="defaultStore.state.animation && props.transition?.enterToClass || undefined"
		:leave-from-class="defaultStore.state.animation && props.transition?.leaveFromClass || undefined"
	>
		<img v-show="loaded && !forceBlurhash" :height="height" :width="width" :class="$style.img" :src="src ?? undefined" :title="title ?? undefined" :alt="alt ?? undefined" loading="eager" @load="onLoad"/>
	</Transition>
</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, shallowRef, useCssModule, watch } from 'vue';
import { defaultStore } from '@/store';
import DrawBlurhash from '@/workers/draw-blurhash?worker';

let worker: Worker;

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
const offscreen = computed(() => {
	if (!canvas.value) return;
	const _offscreen = canvas.value.transferControlToOffscreen();
	worker.postMessage({
		canvas: _offscreen,
	}, [_offscreen]);
	return _offscreen;
});
let loaded = $ref(false);
let canvasWidth = $ref(props.width);
let canvasHeight = $ref(props.height);

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

function draw() {
	if (props.hash == null || !offscreen.value) return;
	worker.postMessage({
		hash: props.hash,
		width: canvasWidth,
		height: canvasHeight,
	});
}

watch([() => props.hash, offscreen], () => {
	draw();
});

onMounted(() => {
	worker = new DrawBlurhash();
	if (props.forceBlurhash) {
		draw();
	} else {
		// 100ms後に画像の読み込みが完了していなければblurhashを描画する
		setTimeout(() => {
			if (!loaded) {
				draw();
			}
		}, 100);
	}
});

onUnmounted(() => {
	worker.terminate();
});
</script>

<style lang="scss" module>
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
	position: absolute;
	top: 0;
	left: 0;
}
</style>
