<template>
<svg :viewBox="`0 0 ${ viewBoxX } ${ viewBoxY }`">
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
				stroke-width="0.7"/>
			<circle
				:cx="headX"
				:cy="headY"
				r="1.2"
				fill="#fff"/>
		</mask>
	</defs>
	<rect
		x="-2" y="-2"
		:width="viewBoxX + 4" :height="viewBoxY + 4"
		:style="`stroke: none; fill: url(#${ gradientId }); mask: url(#${ maskId })`"/>
</svg>
</template>

<script lang="ts">
import Vue from 'vue';
import * as uuid from 'uuid';

export default Vue.extend({
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
			headY: null
		};
	},
	watch: {
		src() {
			this.draw();
		}
	},
	created() {
		this.draw();
	},
	methods: {
		draw() {
			const stats = this.src.slice().reverse();
			const peak = Math.max.apply(null, stats) || 1;

			const polylinePoints = stats.map((x, i) => [this.viewBoxX - ((stats.length - 1) - i), (1 - (x / peak)) * this.viewBoxY]);
			this.polylinePoints = polylinePoints.map(xy => `${xy[0]},${xy[1]}`).join(' ');

			this.polygonPoints = `${this.viewBoxX - (stats.length - 1)},${ this.viewBoxY } ${ this.polylinePoints } ${ this.viewBoxX },${ this.viewBoxY }`;

			this.headX = polylinePoints[polylinePoints.length - 1][0];
			this.headY = polylinePoints[polylinePoints.length - 1][1];
		}
	}
});
</script>
