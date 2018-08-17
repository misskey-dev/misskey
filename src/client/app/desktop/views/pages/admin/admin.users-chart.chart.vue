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
		data: {
			required: true
		},
		type: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			chart: this.data,
			viewBoxX: 365,
			viewBoxY: 70,
			points: null
		};
	},
	created() {
		this.chart.forEach(d => {
			d.count = this.type == 'local' ? d.local : d.remote;
		});

		const peak = Math.max.apply(null, this.chart.map(d => d.count));

		if (peak != 0) {
			const data = this.chart.slice().reverse();
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
