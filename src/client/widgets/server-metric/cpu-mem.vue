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

<script lang="ts">
import { defineComponent } from 'vue';
import { v4 as uuid } from 'uuid';

export default defineComponent({
	props: {
		connection: {
			required: true,
		},
		meta: {
			required: true,
		}
	},
	data() {
		return {
			viewBoxX: 50,
			viewBoxY: 30,
			stats: [],
			cpuGradientId: uuid(),
			cpuMaskId: uuid(),
			memGradientId: uuid(),
			memMaskId: uuid(),
			cpuPolylinePoints: '',
			memPolylinePoints: '',
			cpuPolygonPoints: '',
			memPolygonPoints: '',
			cpuHeadX: null,
			cpuHeadY: null,
			memHeadX: null,
			memHeadY: null,
			cpuP: '',
			memP: ''
		};
	},
	mounted() {
		this.connection.on('stats', this.onStats);
		this.connection.on('statsLog', this.onStatsLog);
		this.connection.send('requestLog', {
			id: Math.random().toString().substr(2, 8)
		});
	},
	beforeUnmount() {
		this.connection.off('stats', this.onStats);
		this.connection.off('statsLog', this.onStatsLog);
	},
	methods: {
		onStats(stats) {
			this.stats.push(stats);
			if (this.stats.length > 50) this.stats.shift();

			const cpuPolylinePoints = this.stats.map((s, i) => [this.viewBoxX - ((this.stats.length - 1) - i), (1 - s.cpu) * this.viewBoxY]);
			const memPolylinePoints = this.stats.map((s, i) => [this.viewBoxX - ((this.stats.length - 1) - i), (1 - (s.mem.active / this.meta.mem.total)) * this.viewBoxY]);
			this.cpuPolylinePoints = cpuPolylinePoints.map(xy => `${xy[0]},${xy[1]}`).join(' ');
			this.memPolylinePoints = memPolylinePoints.map(xy => `${xy[0]},${xy[1]}`).join(' ');

			this.cpuPolygonPoints = `${this.viewBoxX - (this.stats.length - 1)},${this.viewBoxY} ${this.cpuPolylinePoints} ${this.viewBoxX},${this.viewBoxY}`;
			this.memPolygonPoints = `${this.viewBoxX - (this.stats.length - 1)},${this.viewBoxY} ${this.memPolylinePoints} ${this.viewBoxX},${this.viewBoxY}`;

			this.cpuHeadX = cpuPolylinePoints[cpuPolylinePoints.length - 1][0];
			this.cpuHeadY = cpuPolylinePoints[cpuPolylinePoints.length - 1][1];
			this.memHeadX = memPolylinePoints[memPolylinePoints.length - 1][0];
			this.memHeadY = memPolylinePoints[memPolylinePoints.length - 1][1];

			this.cpuP = (stats.cpu * 100).toFixed(0);
			this.memP = (stats.mem.active / this.meta.mem.total * 100).toFixed(0);
		},
		onStatsLog(statsLog) {
			for (const stats of [...statsLog].reverse()) {
				this.onStats(stats);
			}
		}
	}
});
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
			font-size: 5px;
			fill: currentColor;

			> tspan {
				opacity: 0.5;
			}
		}
	}
}
</style>
