<template>
<div :class="[$style.root, { [$style.cover]: cover }]" :title="title">
	<canvas v-if="!loaded" ref="canvas" :class="$style.canvas" :width="size" :height="size" :title="title"/>
	<img v-if="src" :class="$style.img" :src="src" :title="title" :alt="alt" @load="onLoad"/>
</div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { decode } from 'blurhash';

const props = withDefaults(defineProps<{
	src?: string | null;
	hash?: string;
	alt?: string;
	title?: string | null;
	size?: number;
	cover?: boolean;
}>(), {
	src: null,
	alt: '',
	title: null,
	size: 64,
	cover: true,
});

const canvas = $shallowRef<HTMLCanvasElement>();
let loaded = $ref(false);

function draw() {
	if (props.hash == null) return;
	const pixels = decode(props.hash, props.size, props.size);
	const ctx = canvas.getContext('2d');
	const imageData = ctx!.createImageData(props.size, props.size);
	imageData.data.set(pixels);
	ctx!.putImageData(imageData, 0, 0);
}

function onLoad() {
	loaded = true;
}

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
	position: absolute;
	object-fit: cover;
}

.img {
	object-fit: contain;
}
</style>
