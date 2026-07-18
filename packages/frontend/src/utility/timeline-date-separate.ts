/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed } from 'vue';
import type { Ref, ShallowRef } from 'vue';

export function getDateText(dateInstance: Date) {
	const date = dateInstance.getDate();
	const month = dateInstance.getMonth() + 1;
	return `${month.toString()}/${date.toString()}`;
}

// TODO: いちいちDateインスタンス作成するのは無駄感あるから文字列のまま解析したい
export function isSeparatorNeeded(
	prev: string | null,
	next: string | null,
) {
	if (prev == null || next == null) return false;
	const prevDate = new Date(prev);
	const nextDate = new Date(next);
	return (
		prevDate.getFullYear() !== nextDate.getFullYear() ||
		prevDate.getMonth() !== nextDate.getMonth() ||
		prevDate.getDate() !== nextDate.getDate()
	);
}

// TODO: いちいちDateインスタンス作成するのは無駄感あるから文字列のまま解析したい
export function getSeparatorInfo(
	prev: string | null,
	next: string | null,
) {
	if (prev == null || next == null) return null;
	const prevDate = new Date(prev);
	const nextDate = new Date(next);
	return {
		prevDate,
		prevText: getDateText(prevDate),
		nextDate,
		nextText: getDateText(nextDate),
	};
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

export function makeDateSeparatedTimelineComputedRef<T extends { id: string; createdAt: string; }>(items: Ref<T[]> | ShallowRef<T[]>) {
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

export type DateGroupedTimelineItem<T> = {
	date: Date;
	items: T[];
};

export function makeDateGroupedTimelineComputedRef<T extends { id: string; createdAt: string; }>(items: Ref<T[]> | ShallowRef<T[]>, span: 'day' | 'month' = 'day') {
	return computed<DateGroupedTimelineItem<T>[]>(() => {
		const tl: DateGroupedTimelineItem<T>[] = [];
		for (let i = 0; i < items.value.length; i++) {
			const item = items.value[i];
			const date = new Date(item.createdAt);
			const _nextDate = items.value[i + 1] ? new Date(items.value[i + 1].createdAt) : null;

			if (tl.length === 0 || (
				span === 'day' && tl[tl.length - 1].date.getTime() !== date.getTime()
			) || (
				span === 'month' && (
					tl[tl.length - 1].date.getFullYear() !== date.getFullYear() ||
					tl[tl.length - 1].date.getMonth() !== date.getMonth()
				)
			)) {
				tl.push({
					date,
					items: [],
				});
			}
			tl[tl.length - 1].items.push(item);
		}
		return tl;
	});
}
