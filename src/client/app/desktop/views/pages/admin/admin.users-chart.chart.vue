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
		const peak = Math.max.apply(null, this.chart.map(d => this.type == 'local' ? d.users.local.diff : d.users.remote.diff));

		if (peak != 0) {
			const data = this.chart.slice().reverse().map(x => ({
				count: this.type == 'local' ? x.users.local.diff : x.users.remote.diff
			}));

			this.points = data.map((d, i) => `${i},${(1 - (d.count / peak)) * this.viewBoxY}`).join(' ');
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
