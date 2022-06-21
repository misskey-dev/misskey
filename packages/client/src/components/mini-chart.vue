<template>
<svg :viewBox="`0 0 ${ viewBoxX } ${ viewBoxY }`" style="overflow:visible">
	<defs>
		<linearGradient :id="gradientId" x1="0" x2="0" y1="1" y2="0">
			<stop offset="0%" stop-color="hsl(200, 80%, 70%)"></stop>
			<stop offset="100%" stop-color="hsl(90, 80%, 70%)"></stop>
		</linearGradient>
		<mask :id="maskId" x="0" y="0" :width="viewBoxX" :height="viewBoxY">
			<polygon
				:points="polygonPoints"
				fill="#fff"
				fill-opacity="0.5"
			/>
			<polyline
				:points="polylinePoints"
				fill="none"
				stroke="#fff"
				stroke-width="2"
			/>
			<circle
				:cx="headX"
				:cy="headY"
				r="3"
				fill="#fff"
			/>
		</mask>
	</defs>
	<rect
		x="-10" y="-10"
		:width="viewBoxX + 20" :height="viewBoxY + 20"
		:style="`stroke: none; fill: url(#${ gradientId }); mask: url(#${ maskId })`"
	/>
</svg>
</template>

<script lang="ts" setup>
import { onUnmounted, watch } from 'vue';
import { v4 as uuid } from 'uuid';

const props = defineProps<{
	src: number[];
}>();

const viewBoxX = 50;
const viewBoxY = 50;
const gradientId = uuid();
const maskId = uuid();
let polylinePoints = $ref('');
let polygonPoints = $ref('');
let headX = $ref<number | null>(null);
let headY = $ref<number | null>(null);
let clock = $ref<number | null>(null);

function draw(): void {
	const stats = props.src.slice().reverse();
	const peak = Math.max.apply(null, stats) || 1;

	const _polylinePoints = stats.map((n, i) => [
		i * (viewBoxX / (stats.length - 1)),
		(1 - (n / peak)) * viewBoxY,
	]);

	polylinePoints = _polylinePoints.map(xy => `${xy[0]},${xy[1]}`).join(' ');

	polygonPoints = `0,${ viewBoxY } ${ polylinePoints } ${ viewBoxX },${ viewBoxY }`;

	headX = _polylinePoints[_polylinePoints.length - 1][0];
	headY = _polylinePoints[_polylinePoints.length - 1][1];
}

watch(() => props.src, draw, { immediate: true });

// Vueが何故かWatchを発動させない場合があるので
clock = window.setInterval(draw, 1000);

onUnmounted(() => {
	window.clearInterval(clock);
});
</script>
