<template>
<div class="oxxrhrto">
	<svg :viewBox="`0 0 ${ viewBoxX } ${ viewBoxY }`">
		<polygon
			:points="inPolygonPoints"
			fill="#94a029"
			fill-opacity="0.5"
		/>
		<polyline
			:points="inPolylinePoints"
			fill="none"
			stroke="#94a029"
			stroke-width="1"
		/>
		<circle
			:cx="inHeadX"
			:cy="inHeadY"
			r="1.5"
			fill="#94a029"
		/>
		<text x="1" y="5">NET rx <tspan>{{ bytes(inRecent) }}</tspan></text>
	</svg>
	<svg :viewBox="`0 0 ${ viewBoxX } ${ viewBoxY }`">
		<polygon
			:points="outPolygonPoints"
			fill="#ff9156"
			fill-opacity="0.5"
		/>
		<polyline
			:points="outPolylinePoints"
			fill="none"
			stroke="#ff9156"
			stroke-width="1"
		/>
		<circle
			:cx="outHeadX"
			:cy="outHeadY"
			r="1.5"
			fill="#ff9156"
		/>
		<text x="1" y="5">NET tx <tspan>{{ bytes(outRecent) }}</tspan></text>
	</svg>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import bytes from '@client/filters/bytes';

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
			inPolylinePoints: '',
			outPolylinePoints: '',
			inPolygonPoints: '',
			outPolygonPoints: '',
			inHeadX: null,
			inHeadY: null,
			outHeadX: null,
			outHeadY: null,
			inRecent: 0,
			outRecent: 0
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

			const inPeak = Math.max(1024 * 64, Math.max(...this.stats.map(s => s.net.rx)));
			const outPeak = Math.max(1024 * 64, Math.max(...this.stats.map(s => s.net.tx)));

			const inPolylinePoints = this.stats.map((s, i) => [this.viewBoxX - ((this.stats.length - 1) - i), (1 - (s.net.rx / inPeak)) * this.viewBoxY]);
			const outPolylinePoints = this.stats.map((s, i) => [this.viewBoxX - ((this.stats.length - 1) - i), (1 - (s.net.tx / outPeak)) * this.viewBoxY]);
			this.inPolylinePoints = inPolylinePoints.map(xy => `${xy[0]},${xy[1]}`).join(' ');
			this.outPolylinePoints = outPolylinePoints.map(xy => `${xy[0]},${xy[1]}`).join(' ');

			this.inPolygonPoints = `${this.viewBoxX - (this.stats.length - 1)},${this.viewBoxY} ${this.inPolylinePoints} ${this.viewBoxX},${this.viewBoxY}`;
			this.outPolygonPoints = `${this.viewBoxX - (this.stats.length - 1)},${this.viewBoxY} ${this.outPolylinePoints} ${this.viewBoxX},${this.viewBoxY}`;

			this.inHeadX = inPolylinePoints[inPolylinePoints.length - 1][0];
			this.inHeadY = inPolylinePoints[inPolylinePoints.length - 1][1];
			this.outHeadX = outPolylinePoints[outPolylinePoints.length - 1][0];
			this.outHeadY = outPolylinePoints[outPolylinePoints.length - 1][1];

			this.inRecent = stats.net.rx;
			this.outRecent = stats.net.tx;
		},
		onStatsLog(statsLog) {
			for (const stats of [...statsLog].reverse()) {
				this.onStats(stats);
			}
		},
		bytes
	}
});
</script>

<style lang="scss" scoped>
.oxxrhrto {
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
