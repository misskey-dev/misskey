<template>
<div :class="[$style.root, { [$style.cover]: cover }]" :title="title ?? ''">
	<img v-if="!loaded && src && !forceBlurhash" :class="$style.loader" :src="src" @load="onLoad"/>
	<Transition
		mode="in-out"
		:enter-active-class="defaultStore.state.animation && props.transition?.enterActiveClass || ''"
		:leave-active-class="defaultStore.state.animation && props.transition?.leaveActiveClass || ''"
		:enter-from-class="defaultStore.state.animation && props.transition?.enterFromClass || ''"
		:leave-to-class="defaultStore.state.animation && props.transition?.leaveToClass || ''"
	>
		<canvas v-if="!loaded || forceBlurhash" ref="canvas" :class="$style.canvas" :width="size" :height="size" :title="title"/>
		<img v-else :class="$style.img" :src="src" :title="title" :alt="alt"/>
	</Transition>
</div>
</template>

<script lang="ts" setup>
import { onMounted, watch } from 'vue';
import { decode } from 'blurhash';
import { defaultStore } from '@/store';

const props = withDefaults(defineProps<{
	transition?: {
		enterActiveClass?: string;
		leaveActiveClass?: string;
		enterFromClass?: string;
		leaveToClass?: string;
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

const canvas = $shallowRef<HTMLCanvasElement>();
let loaded = $ref(false);
let width = $ref(props.width);
let height = $ref(props.height);

function onLoad() {
	loaded = true;
}

watch([() => props.width, () => props.height], () => {
	const ratio = props.width / props.height;
	if (ratio > 1) {
		width = Math.round(64 * ratio);
		height = 64;
	} else {
		width = 64;
		height = Math.round(64 / ratio);
	}
}, {
	immediate: true,
});

function draw() {
	if (props.hash == null) return;
	const pixels = decode(props.hash, width, height);
	const ctx = canvas.getContext('2d');
	const imageData = ctx!.createImageData(width, height);
	imageData.data.set(pixels);
	ctx!.putImageData(imageData, 0, 0);
}

watch(() => props.hash, () => {
	draw();
});

onMounted(() => {
	draw();
});
</script>

<style lang="scss" module>
.transition_toggle_enterActive,
.transition_toggle_leaveActive {
	transition: opacity 0.5s;
}

.transition_toggle_enterFrom,
.transition_toggle_leaveTo {
	opacity: 0;
}

.loader {
	position: absolute;
	top: 0;
	left: 0;
	width: 0;
	height: 0;
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
	position: absolute;
	object-fit: contain;
}
</style>
