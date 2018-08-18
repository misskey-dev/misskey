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
			pointsNote: null,
			pointsReply: null,
			pointsRenote: null,
			pointsTotal: null
		};
	},
	created() {
		const peak = Math.max.apply(null, this.chart.map(d => this.type == 'local' ? d.notes.local.diff : d.notes.remote.diff));

		if (peak != 0) {
			const data = this.chart.slice().reverse().map(x => ({
				normal: this.type == 'local' ? x.notes.local.diffs.normal : x.notes.remote.diffs.normal,
				reply: this.type == 'local' ? x.notes.local.diffs.reply : x.notes.remote.diffs.reply,
				renote: this.type == 'local' ? x.notes.local.diffs.renote : x.notes.remote.diffs.renote,
				total: this.type == 'local' ? x.notes.local.diff : x.notes.remote.diff
			}));

			this.pointsNote = data.map((d, i) => `${i},${(1 - (d.normal / peak)) * this.viewBoxY}`).join(' ');
			this.pointsReply = data.map((d, i) => `${i},${(1 - (d.reply / peak)) * this.viewBoxY}`).join(' ');
			this.pointsRenote = data.map((d, i) => `${i},${(1 - (d.renote / peak)) * this.viewBoxY}`).join(' ');
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
