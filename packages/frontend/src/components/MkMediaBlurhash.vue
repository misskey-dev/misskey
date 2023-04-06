<template>
<div :class="$style.root" :title="title">
	<canvas ref="canvas" :class="$style.canvas" :width="size" :height="size" :title="title"/>
</div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { decode } from 'blurhash';

/**
 * Blurhash表示専用（＝画像を裏で読み込まない）
 * See also: https://github.com/misskey-dev/misskey/pull/10478#issuecomment-1498278881
 */

const props = withDefaults(defineProps<{
	hash?: string;
	title?: string | null;
	size?: number;
}>(), {
	title: null,
	size: 64,
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

onMounted(() => {
	draw();
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	width: 100%;
	height: 100%;
}

.canvas {
	display: block;
	width: 100%;
	height: 100%;
}

.canvas {
	position: absolute;
	object-fit: cover;
}
</style>