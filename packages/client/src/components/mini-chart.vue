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
				fill-opacity="0.5"/>
			<polyline
				:points="polylinePoints"
				fill="none"
				stroke="#fff"
				stroke-width="2"/>
			<circle
				:cx="headX"
				:cy="headY"
				r="3"
				fill="#fff"/>
		</mask>
	</defs>
	<rect
		x="-10" y="-10"
		:width="viewBoxX + 20" :height="viewBoxY + 20"
		:style="`stroke: none; fill: url(#${ gradientId }); mask: url(#${ maskId })`"/>
</svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { v4 as uuid } from 'uuid';
import * as os from '@/os';

export default defineComponent({
	props: {
		src: {
			type: Array,
			required: true
		}
	},
	data() {
		return {
			viewBoxX: 50,
			viewBoxY: 30,
			gradientId: uuid(),
			maskId: uuid(),
			polylinePoints: '',
			polygonPoints: '',
			headX: null,
			headY: null,
			clock: null
		};
	},
	watch: {
		src() {
			this.draw();
		}
	},
	created() {
		this.draw();

		// Vueが何故かWatchを発動させない場合があるので
		this.clock = window.setInterval(this.draw, 1000);
	},
	beforeUnmount() {
		window.clearInterval(this.clock);
	},
	methods: {
		draw() {
			const stats = this.src.slice().reverse();
			const peak = Math.max.apply(null, stats) || 1;

			const polylinePoints = stats.map((n, i) => [
				i * (this.viewBoxX / (stats.length - 1)),
				(1 - (n / peak)) * this.viewBoxY
			]);

			this.polylinePoints = polylinePoints.map(xy => `${xy[0]},${xy[1]}`).join(' ');

			this.polygonPoints = `0,${ this.viewBoxY } ${ this.polylinePoints } ${ this.viewBoxX },${ this.viewBoxY }`;

			this.headX = polylinePoints[polylinePoints.length - 1][0];
			this.headY = polylinePoints[polylinePoints.length - 1][1];
		}
	}
});
</script>
