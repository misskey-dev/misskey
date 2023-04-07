<template>
<div :class="[$style.root, { [$style.cover]: cover }]" :title="title">
	<img v-if="!loaded && src" :class="$style.loader" :src="src" @load="onLoad"/>
	<Transition
		mode="in-out"
		:enter-active-class="props.animation && defaultStore.state.animation ? $style.transition_toggle_enterActive : ''"
		:leave-active-class="props.animation && defaultStore.state.animation ? $style.transition_toggle_leaveActive : ''"
		:enter-from-class="props.animation && defaultStore.state.animation ? $style.transition_toggle_enterFrom : ''"
		:leave-to-class="props.animation && defaultStore.state.animation ? $style.transition_toggle_leaveTo : ''"
	>
		<canvas v-if="!loaded" ref="canvas" :class="$style.canvas" :width="size" :height="size" :title="title"/>
		<img v-else :class="$style.img" :src="src" :title="title" :alt="alt"/>
	</Transition>
</div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { decode } from 'blurhash';
import { defaultStore } from '@/store';

const props = withDefaults(defineProps<{
	animation?: boolean;
	src?: string | null;
	hash?: string;
	alt?: string;
	title?: string | null;
	size?: number;
	cover?: boolean;
}>(), {
	animation: false,
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
	position: absolute;
	object-fit: contain;
}
</style>
