<template>
<svg viewBox="0 0 21 7">
	<rect
		v-for="record in activity" class="day"
		width="1" height="1"
		:x="record.x" :y="record.date.weekday"
		rx="1" ry="1"
		fill="transparent"
	>
		<title>{{ record.date.year }}/{{ record.date.month + 1 }}/{{ record.date.day }}</title>
	</rect>
	<rect
		v-for="record in activity" class="day"
		:width="record.v" :height="record.v"
		:x="record.x + ((1 - record.v) / 2)" :y="record.date.weekday + ((1 - record.v) / 2)"
		rx="1" ry="1"
		:fill="record.color"
		style="pointer-events: none;"
	/>
	<rect
		class="today"
		width="1" height="1"
		:x="activity[0].x" :y="activity[0].date.weekday"
		rx="1" ry="1"
		fill="none"
		stroke-width="0.1"
		stroke="#f73520"
	/>
</svg>
</template>

<script lang="ts" setup>
const props = defineProps<{
	activity: any[]
}>();

for (const d of props.activity) {
	d.total = d.notes + d.replies + d.renotes;
}
const peak = Math.max(...props.activity.map(d => d.total));

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();
const day = now.getDate();

let x = 20;
props.activity.slice().forEach((d, i) => {
	d.x = x;

	const date = new Date(year, month, day - i);
	d.date = {
		year: date.getFullYear(),
		month: date.getMonth(),
		day: date.getDate(),
		weekday: date.getDay(),
	};

	d.v = peak === 0 ? 0 : d.total / (peak / 2);
	if (d.v > 1) d.v = 1;
	const ch = d.date.weekday === 0 || d.date.weekday === 6 ? 275 : 170;
	const cs = d.v * 100;
	const cl = 15 + ((1 - d.v) * 80);
	d.color = `hsl(${ch}, ${cs}%, ${cl}%)`;

	if (d.date.weekday === 0) x--;
});
</script>

<style lang="scss" scoped>
svg {
	display: block;
	padding: 16px;
	width: 100%;
	box-sizing: border-box;

	> rect {
		transform-origin: center;

		&.day {
			&:hover {
				fill: rgba(#000, 0.05);
			}
		}
	}
}
</style>
