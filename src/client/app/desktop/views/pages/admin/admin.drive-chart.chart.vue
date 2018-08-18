<template>
<svg :viewBox="`0 0 ${ viewBoxX } ${ viewBoxY }`">
	<polyline
		:points="points"
		fill="none"
		stroke-width="1"
		stroke="#555"/>
</svg>
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
			viewBoxX: 365,
			viewBoxY: 70,
			points: null
		};
	},
	created() {
		const peak = Math.max.apply(null, this.chart.map(d => this.type == 'local' ? d.drive.local.totalSize : d.drive.remote.totalSize));

		if (peak != 0) {
			const data = this.chart.slice().reverse().map(x => ({
				size: this.type == 'local' ? x.drive.local.totalSize : x.drive.remote.totalSize
			}));

			this.points = data.map((d, i) => `${i},${(1 - (d.size / peak)) * this.viewBoxY}`).join(' ');
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
