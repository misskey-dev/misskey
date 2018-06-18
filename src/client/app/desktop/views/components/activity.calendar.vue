<template>
<svg viewBox="0 0 21 7">
	<rect v-for="record in data" class="day"
		width="1" height="1"
		:x="record.x" :y="record.date.weekday"
		rx="1" ry="1"
		fill="transparent">
		<title>{{ record.date.year }}/{{ record.date.month }}/{{ record.date.day }}</title>
	</rect>
	<rect v-for="record in data" class="day"
		:width="record.v" :height="record.v"
		:x="record.x + ((1 - record.v) / 2)" :y="record.date.weekday + ((1 - record.v) / 2)"
		rx="1" ry="1"
		:fill="record.color"
		style="pointer-events: none;"/>
	<rect class="today"
		width="1" height="1"
		:x="data[0].x" :y="data[0].date.weekday"
		rx="1" ry="1"
		fill="none"
		stroke-width="0.1"
		stroke="#f73520"/>
</svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['data'],
	created() {
		this.data.forEach(d => d.total = d.notes + d.replies + d.renotes);
		const peak = Math.max.apply(null, this.data.map(d => d.total));

		let x = 0;
		this.data.slice().reverse().forEach(d => {
			d.x = x;
			d.date.weekday = (new Date(d.date.year, d.date.month - 1, d.date.day)).getDay();

			d.v = peak == 0 ? 0 : d.total / (peak / 2);
			if (d.v > 1) d.v = 1;
			const ch = d.date.weekday == 0 || d.date.weekday == 6 ? 275 : 170;
			const cs = d.v * 100;
			const cl = 15 + ((1 - d.v) * 80);
			d.color = `hsl(${ch}, ${cs}%, ${cl}%)`;

			if (d.date.weekday == 6) x++;
		});
	}
});
</script>

<style lang="stylus" scoped>
svg
	display block
	padding 10px
	width 100%

	> rect
		transform-origin center

		&.day
			&:hover
				fill rgba(#000, 0.05)

</style>
