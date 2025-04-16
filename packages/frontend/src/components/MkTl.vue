<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div v-for="(item, i) in items" :key="item.id" :class="$style.item">
		<div :class="$style.itemHead">
			<div :class="$style.itemHeadLine"></div>
			<div :class="$style.itemHeadPoint"></div>
		</div>
		<div :class="$style.itemBody">
			<slot v-if="item.type === 'event'" :event="item.data"></slot>
			<div v-else :class="$style.date"><i class="ti ti-chevron-up"></i> {{ item.prevText }}</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
	events: {
		id: string;
		createdAt: number;
		data: any;
	}[];
}>();

function getDateText(dateInstance: Date) {
	const year = dateInstance.getFullYear();
	const month = dateInstance.getMonth() + 1;
	const date = dateInstance.getDate();
	const hour = dateInstance.getHours();
	return `${year.toString()}/${month.toString()}/${date.toString()} ${hour.toString().padStart(2, '0')}:00:00`;
}

const items = computed(() => {
	const results = [];
	for (let i = 0; i < props.events.length; i++) {
		const item = props.events[i];

		const date = new Date(item.createdAt);
		const nextDate = props.events[i + 1] ? new Date(props.events[i + 1].createdAt) : null;

		results.push({
			id: item.id,
			type: 'event',
			createdAt: item.createdAt,
			data: item.data,
		});

		if (
			i !== props.events.length - 1 &&
				nextDate != null && (
				date.getFullYear() !== nextDate.getFullYear() ||
					date.getMonth() !== nextDate.getMonth() ||
					date.getDate() !== nextDate.getDate() ||
					date.getHours() !== nextDate.getHours()
			)
		) {
			results.push({
				id: `date-${item.id}`,
				type: 'date',
				prev: date,
				prevText: getDateText(date),
				next: nextDate,
				nextText: getDateText(nextDate),
			});
		}
	}
	return results;
});
</script>

<style lang="scss" module>
.root {

}

.item {
	display: flex;
	align-items: stretch;
}

.itemHead {
	position: relative;
	width: 18px;
	margin-right: 8px;
}

.itemHeadLine {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	margin: auto;
	width: 3px;
	height: 100%;
	background: color-mix(in srgb, var(--MI_THEME-accent), var(--MI_THEME-bg) 75%);
}
.itemHeadPoint {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 13px;
	height: 13px;
	background: color-mix(in srgb, var(--MI_THEME-accent), var(--MI_THEME-bg) 75%);
	border-radius: 50%;
	transform: translate(-50%, -50%);
}

.itemBody {
	flex: 1;
	padding: 4px 0;
}

.date {
	opacity: 0.7;
	font-size: 90%;
	padding: 4px;
}
</style>
