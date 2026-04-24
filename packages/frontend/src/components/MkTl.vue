<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.items">
	<template v-for="(item, i) in items" :key="item.id">
		<div :class="$style.left">
			<slot v-if="item.type === 'event'" name="left" :event="item.data" :timestamp="item.timestamp" :delta="item.delta"></slot>
		</div>
		<div :class="[$style.center, item.type === 'date' ? $style.date : '', i === 0 ? $style.first : '', i === items.length - 1 ? $style.last : '']">
			<div :class="$style.centerLine"></div>
			<div :class="$style.centerPoint"></div>
		</div>
		<div :class="$style.right">
			<slot v-if="item.type === 'event'" name="right" :event="item.data" :timestamp="item.timestamp" :delta="item.delta"></slot>
			<div v-else :class="$style.dateLabel"><i class="ti ti-chevron-up"></i> {{ item.prevText }}</div>
		</div>
	</template>
</div>
</template>

<script lang="ts">
export type TlEvent<E = any> = {
	id: string;
	timestamp: number;
	data: E;
};
</script>

<script lang="ts" setup generic="T extends unknown">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
	events: TlEvent<T>[];
	groupBy?: 'd' | 'h';
}>(), {
	groupBy: 'd',
});

const events = computed(() => {
	return props.events.toSorted((a, b) => b.timestamp - a.timestamp);
});

function getDateText(dateInstance: Date) {
	const year = dateInstance.getFullYear();
	const month = dateInstance.getMonth() + 1;
	const date = dateInstance.getDate();
	const hour = dateInstance.getHours();
	return `${year.toString()}/${month.toString()}/${date.toString()} ${hour.toString().padStart(2, '0')}:00:00`;
}

type TlItem<T> = ({
	id: string;
	type: 'event';
	timestamp: number;
	delta: number
	data: T;
} | {
	id: string;
	type: 'date';
	prev: Date;
	prevText: string;
	next: Date | null;
	nextText: string;
});

const items = computed<TlItem<T>[]>(() => {
	const results: TlItem<T>[] = [];

	for (let i = 0; i < events.value.length; i++) {
		const item = events.value[i];

		const date = new Date(item.timestamp);
		const nextDate = events.value[i + 1] ? new Date(events.value[i + 1].timestamp) : null;

		results.push({
			id: item.id,
			type: 'event',
			timestamp: item.timestamp,
			delta: i === events.value.length - 1 ? 0 : item.timestamp - events.value[i + 1].timestamp,
			data: item.data,
		});

		if (i !== events.value.length - 1 && nextDate != null) {
			let needsSeparator = false;

			if (props.groupBy === 'd') {
				needsSeparator = (
					date.getFullYear() !== nextDate.getFullYear() ||
					date.getMonth() !== nextDate.getMonth() ||
					date.getDate() !== nextDate.getDate()
				);
			} else if (props.groupBy === 'h') {
				needsSeparator = (
					date.getFullYear() !== nextDate.getFullYear() ||
					date.getMonth() !== nextDate.getMonth() ||
					date.getDate() !== nextDate.getDate() ||
					date.getHours() !== nextDate.getHours()
				);
			}

			if (needsSeparator) {
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
	}

	return results;
});
</script>

<style lang="scss" module>
.items {
	display: grid;
	grid-template-columns: max-content 18px 1fr;
	gap: 0 8px;
}

.center {
	position: relative;

	&.date {
		.centerPoint::before {
			position: absolute;
			content: "";
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			margin: auto;
			width: 7px;
			height: 7px;
			background: var(--MI_THEME-bg);
			border-radius: 50%;
		}
	}

	&.first {
		.centerLine {
			height: 50%;
			top: auto;
			bottom: 0;
		}
	}

	&.last {
		.centerLine {
			height: 50%;
			top: 0;
			bottom: auto;
		}
	}
}

.centerLine {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	margin: auto;
	width: 3px;
	height: 100%;
	background: color-mix(in srgb, var(--MI_THEME-accent), var(--MI_THEME-bg) 75%);
}

.centerPoint {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	margin: auto;
	width: 13px;
	height: 13px;
	background: color-mix(in srgb, var(--MI_THEME-accent), var(--MI_THEME-bg) 75%);
	border-radius: 50%;
}

.left {
	min-width: 0;
	align-self: center;
	justify-self: right;
}

.right {
	min-width: 0;
	align-self: center;
}

.dateLabel {
	opacity: 0.7;
	font-size: 90%;
	padding: 4px;
	margin: 8px 0;
}
</style>
