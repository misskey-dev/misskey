<template>
<div class="mkw-posts-monitor">
	<ui-container :show-header="props.design == 0" :naked="props.design == 2">
		<template #header><fa icon="chart-line"/>{{ $t('title') }}</template>
		<template #func><button @click="toggle" :title="$t('toggle')"><fa icon="sort"/></button></template>

		<div class="qpdmibaztplkylerhdbllwcokyrfxeyj" :class="{ dual: props.view == 0 }">
			<svg :viewBox="`0 0 ${ viewBoxX } ${ viewBoxY }`" v-show="props.view != 2">
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
						<circle
							:cx="localHeadX"
							:cy="localHeadY"
							r="1.5"
							fill="#fff"/>
					</mask>
				</defs>
				<rect
					x="-2" y="-2"
					:width="viewBoxX + 4" :height="viewBoxY + 4"
					:style="`stroke: none; fill: url(#${ localGradientId }); mask: url(#${ localMaskId })`"/>
				<text x="1" y="5">Local</text>
			</svg>
			<svg :viewBox="`0 0 ${ viewBoxX } ${ viewBoxY }`" v-show="props.view != 1">
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
						<circle
							:cx="fediHeadX"
							:cy="fediHeadY"
							r="1.5"
							fill="#fff"/>
					</mask>
				</defs>
				<rect
					x="-2" y="-2"
					:width="viewBoxX + 4" :height="viewBoxY + 4"
					:style="`stroke: none; fill: url(#${ fediGradientId }); mask: url(#${ fediMaskId })`"/>
				<text x="1" y="5">Fedi</text>
			</svg>
		</div>
	</ui-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import i18n from '../../../i18n';
import * as uuid from 'uuid';

export default define({
	name: 'posts-monitor',
	props: () => ({
		design: 0,
		view: 0
	})
}).extend({
	i18n: i18n('common/views/widgets/posts-monitor.vue'),

	data() {
		return {
			connection: null,
			viewBoxY: 30,
			stats: [],
			fediGradientId: uuid(),
			fediMaskId: uuid(),
			localGradientId: uuid(),
			localMaskId: uuid(),
			fediPolylinePoints: '',
			localPolylinePoints: '',
			fediPolygonPoints: '',
			localPolygonPoints: '',
			fediHeadX: null,
			fediHeadY: null,
			localHeadX: null,
			localHeadY: null
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
		this.connection = this.$root.stream.useSharedConnection('notesStats');

		this.connection.on('stats', this.onStats);
		this.connection.on('statsLog', this.onStatsLog);
		this.connection.send('requestLog',{
			id: Math.random().toString().substr(2, 8)
		});
	},
	beforeDestroy() {
		this.connection.dispose();
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

			const fediPolylinePoints = stats.map((s, i) => [this.viewBoxX - ((stats.length - 1) - i), (1 - (s.all / fediPeak)) * this.viewBoxY]);
			const localPolylinePoints = stats.map((s, i) => [this.viewBoxX - ((stats.length - 1) - i), (1 - (s.local / localPeak)) * this.viewBoxY]);
			this.fediPolylinePoints = fediPolylinePoints.map(xy => `${xy[0]},${xy[1]}`).join(' ');
			this.localPolylinePoints = localPolylinePoints.map(xy => `${xy[0]},${xy[1]}`).join(' ');

			this.fediPolygonPoints = `${this.viewBoxX - (stats.length - 1)},${ this.viewBoxY } ${ this.fediPolylinePoints } ${ this.viewBoxX },${ this.viewBoxY }`;
			this.localPolygonPoints = `${this.viewBoxX - (stats.length - 1)},${ this.viewBoxY } ${ this.localPolylinePoints } ${ this.viewBoxX },${ this.viewBoxY }`;

			this.fediHeadX = fediPolylinePoints[fediPolylinePoints.length - 1][0];
			this.fediHeadY = fediPolylinePoints[fediPolylinePoints.length - 1][1];
			this.localHeadX = localPolylinePoints[localPolylinePoints.length - 1][0];
			this.localHeadY = localPolylinePoints[localPolylinePoints.length - 1][1];
		},
		onStats(stats) {
			this.stats.push(stats);
			if (this.stats.length > 100) this.stats.shift();
			this.draw();
		},
		onStatsLog(statsLog) {
			for (const stats of statsLog) this.onStats(stats);
		}
	}
});
</script>

<style lang="stylus" scoped>
.qpdmibaztplkylerhdbllwcokyrfxeyj
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
			fill var(--chartCaption)

			> tspan
				opacity 0.5

	&:after
		content ""
		display block
		clear both

</style>
