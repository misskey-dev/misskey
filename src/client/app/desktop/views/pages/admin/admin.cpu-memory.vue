<template>
<div class="zyknedwtlthezamcjlolyusmipqmjgxz">
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
					fill-opacity="0.5"/>
				<polyline
					:points="cpuPolylinePoints"
					fill="none"
					stroke="#fff"
					stroke-width="1"/>
			</mask>
		</defs>
		<rect
			x="0" y="0"
			:width="viewBoxX" :height="viewBoxY"
			:style="`stroke: none; fill: url(#${ cpuGradientId }); mask: url(#${ cpuMaskId })`"/>
		<text x="1" y="12">CPU <tspan>{{ cpuP }}%</tspan></text>
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
					fill-opacity="0.5"/>
				<polyline
					:points="memPolylinePoints"
					fill="none"
					stroke="#fff"
					stroke-width="1"/>
			</mask>
		</defs>
		<rect
			x="0" y="0"
			:width="viewBoxX" :height="viewBoxY"
			:style="`stroke: none; fill: url(#${ memGradientId }); mask: url(#${ memMaskId })`"/>
		<text x="1" y="12">MEM <tspan>{{ memP }}%</tspan></text>
	</svg>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as uuid from 'uuid';

export default Vue.extend({
	props: ['connection'],
	data() {
		return {
			viewBoxX: 200,
			viewBoxY: 70,
			stats: [],
			cpuGradientId: uuid(),
			cpuMaskId: uuid(),
			memGradientId: uuid(),
			memMaskId: uuid(),
			cpuPolylinePoints: '',
			memPolylinePoints: '',
			cpuPolygonPoints: '',
			memPolygonPoints: '',
			cpuP: '',
			memP: ''
		};
	},
	mounted() {
		this.connection.on('stats', this.onStats);
		this.connection.on('statsLog', this.onStatsLog);
		this.connection.send({
			type: 'requestLog',
			id: Math.random().toString(),
			length: 200
		});
	},
	beforeDestroy() {
		this.connection.off('stats', this.onStats);
		this.connection.off('statsLog', this.onStatsLog);
	},
	methods: {
		onStats(stats) {
			this.stats.push(stats);
			if (this.stats.length > 200) this.stats.shift();

			const cpuPolylinePoints = this.stats.map((s, i) => [this.viewBoxX - ((this.stats.length - 1) - i), (1 - s.cpu_usage) * this.viewBoxY]);
			const memPolylinePoints = this.stats.map((s, i) => [this.viewBoxX - ((this.stats.length - 1) - i), (1 - (s.mem.used / s.mem.total)) * this.viewBoxY]);
			this.cpuPolylinePoints = cpuPolylinePoints.map(xy => `${xy[0]},${xy[1]}`).join(' ');
			this.memPolylinePoints = memPolylinePoints.map(xy => `${xy[0]},${xy[1]}`).join(' ');

			this.cpuPolygonPoints = `${this.viewBoxX - (this.stats.length - 1)},${this.viewBoxY} ${this.cpuPolylinePoints} ${this.viewBoxX},${this.viewBoxY}`;
			this.memPolygonPoints = `${this.viewBoxX - (this.stats.length - 1)},${this.viewBoxY} ${this.memPolylinePoints} ${this.viewBoxX},${this.viewBoxY}`;

			this.cpuP = (stats.cpu_usage * 100).toFixed(0);
			this.memP = (stats.mem.used / stats.mem.total * 100).toFixed(0);
		},
		onStatsLog(statsLog) {
			statsLog.reverse().forEach(stats => this.onStats(stats));
		}
	}
});
</script>

<style lang="stylus" scoped>
.zyknedwtlthezamcjlolyusmipqmjgxz
	> svg
		display block
		width 50%
		float left

		&:first-child
			padding-right 5px

		&:last-child
			padding-left 5px

		> text
			font-size 10px
			fill var(--chartCaption)

			> tspan
				opacity 0.5

	&:after
		content ""
		display block
		clear both

</style>
