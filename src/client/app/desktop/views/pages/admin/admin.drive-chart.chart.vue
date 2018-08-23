<template>
<div>
	<a @click="span = 'day'">Per day</a> | <a @click="span = 'hour'">Per hour</a>
	<svg :viewBox="`0 0 ${ viewBoxX } ${ viewBoxY }`">
		<polyline
			:points="points"
			fill="none"
			stroke-width="0.3"
			stroke="#555"/>
	</svg>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		chart: {
			required: true
		},
		type: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			viewBoxX: 100,
			viewBoxY: 30,
			points: null,
			span: 'day'
		};
	},
	computed: {
		stats(): any[] {
			return (
				this.span == 'day' ? this.chart.perDay :
				this.span == 'hour' ? this.chart.perHour :
				null
			);
		}
	},
	watch: {
		stats() {
			this.render();
		}
	},
	mounted() {
		this.render();
	},
	methods: {
		render() {
			const peak = Math.max.apply(null, this.stats.map(d => this.type == 'local' ? d.drive.local.totalSize : d.drive.remote.totalSize));

			if (peak != 0) {
				const data = this.stats.slice().reverse().map(x => ({
					size: this.type == 'local' ? x.drive.local.totalSize : x.drive.remote.totalSize
				}));

				this.points = data.map((d, i) => `${(this.viewBoxX / data.length) * i},${(1 - (d.size / peak)) * this.viewBoxY}`).join(' ');
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
svg
	display block
	padding 10px
	width 100%

</style>
