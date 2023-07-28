<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="lcfyofjk">
	<svg :viewBox="`0 0 ${ viewBoxX } ${ viewBoxY }`">
		<defs>
			<linearGradient :id="cpuGradientId" x1="0" x2="0" y1="1" y2="0">
				<stop offset="0%" stop-color="hsl(180, 80%, 70%)"></stop>
				<stop offset="100%" stop-color="hsl(0, 80%, 70%)"></stop>
			</linearGradient>
			<mask :id="cpuMaskId" x="0" y="0" :width="viewBoxX" :height="viewBoxY">
				<polygon
					:points="cpuPolygonPoints"
					fill="#fff"
					fill-opacity="0.5"
				/>
				<polyline
					:points="cpuPolylinePoints"
					fill="none"
					stroke="#fff"
					stroke-width="1"
				/>
				<circle
					:cx="cpuHeadX"
					:cy="cpuHeadY"
					r="1.5"
					fill="#fff"
				/>
			</mask>
		</defs>
		<rect
			x="-2" y="-2"
			:width="viewBoxX + 4" :height="viewBoxY + 4"
			:style="`stroke: none; fill: url(#${ cpuGradientId }); mask: url(#${ cpuMaskId })`"
		/>
		<text x="1" y="5">CPU <tspan>{{ cpuP }}%</tspan></text>
	</svg>
	<svg :viewBox="`0 0 ${ viewBoxX } ${ viewBoxY }`">
		<defs>
			<linearGradient :id="memGradientId" x1="0" x2="0" y1="1" y2="0">
				<stop offset="0%" stop-color="hsl(180, 80%, 70%)"></stop>
				<stop offset="100%" stop-color="hsl(0, 80%, 70%)"></stop>
			</linearGradient>
			<mask :id="memMaskId" x="0" y="0" :width="viewBoxX" :height="viewBoxY">
				<polygon
					:points="memPolygonPoints"
					fill="#fff"
					fill-opacity="0.5"
				/>
				<polyline
					:points="memPolylinePoints"
					fill="none"
					stroke="#fff"
					stroke-width="1"
				/>
				<circle
					:cx="memHeadX"
					:cy="memHeadY"
					r="1.5"
					fill="#fff"
				/>
			</mask>
		</defs>
		<rect
			x="-2" y="-2"
			:width="viewBoxX + 4" :height="viewBoxY + 4"
			:style="`stroke: none; fill: url(#${ memGradientId }); mask: url(#${ memMaskId })`"
		/>
		<text x="1" y="5">MEM <tspan>{{ memP }}%</tspan></text>
	</svg>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { v4 as uuid } from 'uuid';

const props = defineProps<{
	connection: any,
	meta: any
}>();

let viewBoxX: number = $ref(50);
let viewBoxY: number = $ref(30);
let stats: any[] = $ref([]);
const cpuGradientId = uuid();
const cpuMaskId = uuid();
const memGradientId = uuid();
const memMaskId = uuid();
let cpuPolylinePoints: string = $ref('');
let memPolylinePoints: string = $ref('');
let cpuPolygonPoints: string = $ref('');
let memPolygonPoints: string = $ref('');
let cpuHeadX: any = $ref(null);
let cpuHeadY: any = $ref(null);
let memHeadX: any = $ref(null);
let memHeadY: any = $ref(null);
let cpuP: string = $ref('');
let memP: string = $ref('');

onMounted(() => {
	props.connection.on('stats', onStats);
	props.connection.on('statsLog', onStatsLog);
	props.connection.send('requestLog', {
		id: Math.random().toString().substring(2, 10),
	});
});

onBeforeUnmount(() => {
	props.connection.off('stats', onStats);
	props.connection.off('statsLog', onStatsLog);
});

function onStats(connStats) {
	stats.push(connStats);
	if (stats.length > 50) stats.shift();

	let cpuPolylinePointsStats = stats.map((s, i) => [viewBoxX - ((stats.length - 1) - i), (1 - s.cpu) * viewBoxY]);
	let memPolylinePointsStats = stats.map((s, i) => [viewBoxX - ((stats.length - 1) - i), (1 - (s.mem.active / props.meta.mem.total)) * viewBoxY]);
	cpuPolylinePoints = cpuPolylinePointsStats.map(xy => `${xy[0]},${xy[1]}`).join(' ');
	memPolylinePoints = memPolylinePointsStats.map(xy => `${xy[0]},${xy[1]}`).join(' ');

	cpuPolygonPoints = `${viewBoxX - (stats.length - 1)},${viewBoxY} ${cpuPolylinePoints} ${viewBoxX},${viewBoxY}`;
	memPolygonPoints = `${viewBoxX - (stats.length - 1)},${viewBoxY} ${memPolylinePoints} ${viewBoxX},${viewBoxY}`;

	cpuHeadX = cpuPolylinePointsStats.at(-1)![0];
	cpuHeadY = cpuPolylinePointsStats.at(-1)![1];
	memHeadX = memPolylinePointsStats.at(-1)![0];
	memHeadY = memPolylinePointsStats.at(-1)![1];

	cpuP = (connStats.cpu * 100).toFixed(0);
	memP = (connStats.mem.active / props.meta.mem.total * 100).toFixed(0);
}

function onStatsLog(statsLog) {
	for (const revStats of [...statsLog].reverse()) {
		onStats(revStats);
	}
}
</script>

<style lang="scss" scoped>
.lcfyofjk {
	display: flex;

	> svg {
		display: block;
		padding: 10px;
		width: 50%;

		&:first-child {
			padding-right: 5px;
		}

		&:last-child {
			padding-left: 5px;
		}

		> text {
			font-size: 4.5px;
			fill: currentColor;

			> tspan {
				opacity: 0.5;
			}
		}
	}
}
</style>
