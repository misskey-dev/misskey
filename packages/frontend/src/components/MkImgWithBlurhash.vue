<template>
<div :class="[$style.root, { [$style.cover]: cover }]" :title="title ?? ''">
	<canvas v-if="!loaded" ref="canvas" :class="$style.canvas" :width="width" :height="height" :title="title ?? ''"/>
	<img v-if="src" v-show="loaded" :class="$style.img" :src="src" :title="title ?? ''" :alt="alt ?? ''" @load="onLoad"/>
</div>
</template>

<script lang="ts" setup>
import { onMounted, watch } from 'vue';
import { decode } from 'blurhash';

const props = withDefaults(defineProps<{
	src?: string | null;
	hash?: string;
	alt?: string | null;
	title?: string | null;
	height?: number;
	width?: number;
	cover?: boolean;
}>(), {
	src: null,
	alt: '',
	title: null,
	height: 64,
	width: 64,
	cover: true,
});

const canvas = $shallowRef<HTMLCanvasElement>();
let loaded = $ref(false);
let width = $ref(props.width);
let height = $ref(props.height);

function draw() {
	if (props.hash == null) return;
	const pixels = decode(props.hash, props.width, props.height);
	const ctx = canvas.getContext('2d');
	const imageData = ctx!.createImageData(props.width, props.height);
	imageData.data.set(pixels);
	ctx!.putImageData(imageData, 0, 0);
}

function onLoad() {
	loaded = true;
}

watch(() => props.hash, () => {
	draw();
});

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

onMounted(() => {
	draw();
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
}
</style>
