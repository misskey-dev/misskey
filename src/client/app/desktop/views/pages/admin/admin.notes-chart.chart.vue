<template>
<div>
	<a @click="span = 'day'">Per day</a> | <a @click="span = 'hour'">Per hour</a>
	<svg :viewBox="`0 0 ${ viewBoxX } ${ viewBoxY }`">
		<polyline
			:points="pointsNote"
			fill="none"
			stroke-width="0.3"
			stroke="#41ddde"/>
		<polyline
			:points="pointsReply"
			fill="none"
			stroke-width="0.3"
			stroke="#f7796c"/>
		<polyline
			:points="pointsRenote"
			fill="none"
			stroke-width="0.3"
			stroke="#a1de41"/>
		<polyline
			:points="pointsTotal"
			fill="none"
			stroke-width="0.3"
			stroke="#555"
			stroke-dasharray="1 1"/>
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
			pointsNote: null,
			pointsReply: null,
			pointsRenote: null,
			pointsTotal: null,
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
			const peak = Math.max.apply(null, this.stats.map(d => this.type == 'local' ? d.notes.local.diff : d.notes.remote.diff));

			if (peak != 0) {
				const data = this.stats.slice().reverse().map(x => ({
					normal: this.type == 'local' ? x.notes.local.diffs.normal : x.notes.remote.diffs.normal,
					reply: this.type == 'local' ? x.notes.local.diffs.reply : x.notes.remote.diffs.reply,
					renote: this.type == 'local' ? x.notes.local.diffs.renote : x.notes.remote.diffs.renote,
					total: this.type == 'local' ? x.notes.local.diff : x.notes.remote.diff
				}));

				this.pointsNote = data.map((d, i) => `${(this.viewBoxX / data.length) * i},${(1 - (d.normal / peak)) * this.viewBoxY}`).join(' ');
				this.pointsReply = data.map((d, i) => `${(this.viewBoxX / data.length) * i},${(1 - (d.reply / peak)) * this.viewBoxY}`).join(' ');
				this.pointsRenote = data.map((d, i) => `${(this.viewBoxX / data.length) * i},${(1 - (d.renote / peak)) * this.viewBoxY}`).join(' ');
				this.pointsTotal = data.map((d, i) => `${(this.viewBoxX / data.length) * i},${(1 - (d.total / peak)) * this.viewBoxY}`).join(' ');
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
