/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed } from 'vue';
import type { Ref } from 'vue';

export function getDateText(dateInstance: Date) {
	const date = dateInstance.getDate();
	const month = dateInstance.getMonth() + 1;
	return `${month.toString()}/${date.toString()}`;
}

export type DateSeparetedTimelineItem<T> = {
	id: string;
	type: 'item';
	data: T;
} | {
	id: string;
	type: 'date';
	prev: Date;
	prevText: string;
	next: Date;
	nextText: string;
};

export function makeDateSeparatedTimelineComputedRef<T extends { id: string; createdAt: string; }>(items: Ref<T[]>) {
	return computed<DateSeparetedTimelineItem<T>[]>(() => {
		const tl: DateSeparetedTimelineItem<T>[] = [];
		for (let i = 0; i < items.value.length; i++) {
			const item = items.value[i];

			const date = new Date(item.createdAt);
			const nextDate = items.value[i + 1] ? new Date(items.value[i + 1].createdAt) : null;

			tl.push({
				id: item.id,
				type: 'item',
				data: item,
			});

			if (
				i !== items.value.length - 1 &&
					nextDate != null && (
					date.getFullYear() !== nextDate.getFullYear() ||
						date.getMonth() !== nextDate.getMonth() ||
						date.getDate() !== nextDate.getDate()
				)
			) {
				tl.push({
					id: `date-${item.id}`,
					type: 'date',
					prev: date,
					prevText: getDateText(date),
					next: nextDate,
					nextText: getDateText(nextDate),
				});
			}
		}
		return tl;
	});
}
