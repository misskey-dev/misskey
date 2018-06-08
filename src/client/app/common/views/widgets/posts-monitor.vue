<template>
<div class="mkw-posts-monitor">
	<mk-widget-container :show-header="props.design == 0" :naked="props.design == 2">
		<template slot="header">%fa:chart-line%%i18n:@title%</template>
		<button slot="func" @click="toggle" title="%i18n:@toggle%">%fa:sort%</button>

		<div class="qpdmibaztplkylerhdbllwcokyrfxeyj" :class="{ dual: props.view == 0 }" :data-darkmode="$store.state.device.darkmode">
			<svg :viewBox="`0 0 ${ viewBoxX } ${ viewBoxY }`" preserveAspectRatio="none" v-show="props.view != 2">
				<defs>
					<linearGradient :id="fediGradientId" x1="0" x2="0" y1="1" y2="0">
						<stop offset="0%" stop-color="hsl(200, 80%, 70%)"></stop>
						<stop offset="100%" stop-color="hsl(90, 80%, 70%)"></stop>
					</linearGradient>
					<mask :id="fediMaskId" x="0" y="0" :width="viewBoxX" :height="viewBoxY">
						<polygon
							:points="fediPolygonPoints"
							fill="#fff"
							fill-opacity="0.5"/>
						<polyline
							:points="fediPolylinePoints"
							fill="none"
							stroke="#fff"
							stroke-width="1"/>
					</mask>
				</defs>
				<rect
					x="-1" y="-1"
					:width="viewBoxX + 2" :height="viewBoxY + 2"
					:style="`stroke: none; fill: url(#${ fediGradientId }); mask: url(#${ fediMaskId })`"/>
				<text x="1" y="5">Fedi</text>
			</svg>
			<svg :viewBox="`0 0 ${ viewBoxX } ${ viewBoxY }`" preserveAspectRatio="none" v-show="props.view != 1">
				<defs>
					<linearGradient :id="localGradientId" x1="0" x2="0" y1="1" y2="0">
						<stop offset="0%" stop-color="hsl(200, 80%, 70%)"></stop>
						<stop offset="100%" stop-color="hsl(90, 80%, 70%)"></stop>
					</linearGradient>
					<mask :id="localMaskId" x="0" y="0" :width="viewBoxX" :height="viewBoxY">
						<polygon
							:points="localPolygonPoints"
							fill="#fff"
							fill-opacity="0.5"/>
						<polyline
							:points="localPolylinePoints"
							fill="none"
							stroke="#fff"
							stroke-width="1"/>
					</mask>
				</defs>
				<rect
					x="-1" y="-1"
					:width="viewBoxX + 2" :height="viewBoxY + 2"
					:style="`stroke: none; fill: url(#${ localGradientId }); mask: url(#${ localMaskId })`"/>
				<text x="1" y="5">Local</text>
			</svg>
		</div>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import * as uuid from 'uuid';

export default define({
	name: 'server',
	props: () => ({
		design: 0,
		view: 0
	})
}).extend({
	data() {
		return {
			connection: null,
			connectionId: null,
			viewBoxY: 30,
			stats: [],
			fediGradientId: uuid(),
			fediMaskId: uuid(),
			localGradientId: uuid(),
			localMaskId: uuid(),
			fediPolylinePoints: '',
			localPolylinePoints: '',
			fediPolygonPoints: '',
			localPolygonPoints: ''
		};
	},
	computed: {
		viewBoxX(): number {
			return this.props.view == 0 ? 50 : 100;
		}
	},
	watch: {
		viewBoxX() {
			this.draw();
		}
	},
	mounted() {
		this.connection = (this as any).os.streams.notesStatsStream.getConnection();
		this.connectionId = (this as any).os.streams.notesStatsStream.use();

		this.connection.on('stats', this.onStats);
		this.connection.on('statsLog', this.onStatsLog);
		this.connection.send({
			type: 'requestLog',
			id: Math.random().toString()
		});
	},
	beforeDestroy() {
		this.connection.off('stats', this.onStats);
		this.connection.off('statsLog', this.onStatsLog);
		(this as any).os.streams.notesStatsStream.dispose(this.connectionId);
	},
	methods: {
		toggle() {
			if (this.props.view == 2) {
				this.props.view = 0;
			} else {
				this.props.view++;
			}
			this.save();
		},
		func() {
			if (this.props.design == 2) {
				this.props.design = 0;
			} else {
				this.props.design++;
			}
			this.save();
		},
		draw() {
			const stats = this.props.view == 0 ? this.stats.slice(-50) : this.stats;
			const fediPeak = Math.max.apply(null, stats.map(x => x.all)) || 1;
			const localPeak = Math.max.apply(null, stats.map(x => x.local)) || 1;

			this.fediPolylinePoints = stats.map((s, i) => `${this.viewBoxX - ((stats.length - 1) - i)},${(1 - (s.all / fediPeak)) * this.viewBoxY}`).join(' ');
			this.localPolylinePoints = stats.map((s, i) => `${this.viewBoxX - ((stats.length - 1) - i)},${(1 - (s.local / localPeak)) * this.viewBoxY}`).join(' ');

			this.fediPolygonPoints = `${this.viewBoxX - (stats.length - 1)},${ this.viewBoxY } ${ this.fediPolylinePoints } ${ this.viewBoxX },${ this.viewBoxY }`;
			this.localPolygonPoints = `${this.viewBoxX - (stats.length - 1)},${ this.viewBoxY } ${ this.localPolylinePoints } ${ this.viewBoxX },${ this.viewBoxY }`;
		},
		onStats(stats) {
			this.stats.push(stats);
			if (this.stats.length > 100) this.stats.shift();
			this.draw();
		},
		onStatsLog(statsLog) {
			statsLog.forEach(stats => this.onStats(stats));
		}
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	&.dual
		> svg
			width 50%
			float left

			&:first-child
				padding-right 5px

			&:last-child
				padding-left 5px

	> svg
		display block
		padding 10px
		width 100%

		> text
			font-size 5px
			fill isDark ? rgba(#fff, 0.55) : rgba(#000, 0.55)

			> tspan
				opacity 0.5

	&:after
		content ""
		display block
		clear both

.qpdmibaztplkylerhdbllwcokyrfxeyj[data-darkmode]
	root(true)

.qpdmibaztplkylerhdbllwcokyrfxeyj:not([data-darkmode])
	root(false)

</style>
