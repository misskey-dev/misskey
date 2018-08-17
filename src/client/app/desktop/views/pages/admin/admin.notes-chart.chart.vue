<template>
<svg :viewBox="`0 0 ${ viewBoxX } ${ viewBoxY }`">
	<polyline
		:points="pointsNote"
		fill="none"
		stroke-width="1"
		stroke="#41ddde"/>
	<polyline
		:points="pointsReply"
		fill="none"
		stroke-width="1"
		stroke="#f7796c"/>
	<polyline
		:points="pointsRenote"
		fill="none"
		stroke-width="1"
		stroke="#a1de41"/>
	<polyline
		:points="pointsTotal"
		fill="none"
		stroke-width="1"
		stroke="#555"
		stroke-dasharray="2 2"/>
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
			pointsNote: null,
			pointsReply: null,
			pointsRenote: null,
			pointsTotal: null
		};
	},
	created() {
		this.chart.forEach(d => {
			d.notes = this.type == 'local' ? d.localNotes : d.remoteNotes;
			d.replies = this.type == 'local' ? d.localReplies : d.remoteReplies;
			d.renotes = this.type == 'local' ? d.localRenotes : d.remoteRenotes;
		});

		this.chart.forEach(d => {
			d.total = d.notes + d.replies + d.renotes;
		});

		const peak = Math.max.apply(null, this.chart.map(d => d.total));

		if (peak != 0) {
			const data = this.chart.slice().reverse();
			this.pointsNote = data.map((d, i) => `${i},${(1 - (d.notes / peak)) * this.viewBoxY}`).join(' ');
			this.pointsReply = data.map((d, i) => `${i},${(1 - (d.replies / peak)) * this.viewBoxY}`).join(' ');
			this.pointsRenote = data.map((d, i) => `${i},${(1 - (d.renotes / peak)) * this.viewBoxY}`).join(' ');
			this.pointsTotal = data.map((d, i) => `${i},${(1 - (d.total / peak)) * this.viewBoxY}`).join(' ');
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
