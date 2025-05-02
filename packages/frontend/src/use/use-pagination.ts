/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, isRef, onMounted, ref, shallowRef, triggerRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import type { ComputedRef, Ref, ShallowRef } from 'vue';
import { misskeyApi } from '@/utility/misskey-api.js';

const MAX_ITEMS = 20;
const MAX_QUEUE_ITEMS = 100;
const FIRST_FETCH_LIMIT = 15;
const SECOND_FETCH_LIMIT = 30;

export type MisskeyEntity = {
	id: string;
	createdAt: string;
	_shouldInsertAd_?: boolean;
	[x: string]: any;
};

export type PagingCtx<E extends keyof Misskey.Endpoints = keyof Misskey.Endpoints> = {
	endpoint: E;
	limit?: number;
	params?: Misskey.Endpoints[E]['req'] | ComputedRef<Misskey.Endpoints[E]['req']>;

	/**
	 * 検索APIのような、ページング不可なエンドポイントを利用する場合
	 * (そのようなAPIをこの関数で使うのは若干矛盾してるけど)
	 */
	noPaging?: boolean;

	/**
	 * items 配列の中身を逆順にする(新しい方が最後)
	 */
	reversed?: boolean;

	offsetMode?: boolean;
};

export function usePagination<T extends MisskeyEntity>(props: {
	ctx: PagingCtx;
	useShallowRef?: boolean;
}) {
	const items = props.useShallowRef ? shallowRef<T[]>([]) : ref<T[]>([]);
	let aheadQueue: T[] = [];
	const queuedAheadItemsCount = ref(0);
	const fetching = ref(true);
	const moreFetching = ref(false);
	const canFetchMore = ref(false);
	const error = ref(false);

	// パラメータに何らかの変更があった際、再読込したい（チャンネル等のIDが変わったなど）
	watch(() => [props.ctx.endpoint, props.ctx.params], init, { deep: true });

	function getNewestId(): string | null | undefined {
		// 様々な要因により並び順は保証されないのでソートが必要
		if (aheadQueue.length > 0) {
			return aheadQueue.map(x => x.id).sort().at(-1);
		}
		return items.value.map(x => x.id).sort().at(-1);
	}

	function getOldestId(): string | null | undefined {
		// 様々な要因により並び順は保証されないのでソートが必要
		return items.value.map(x => x.id).sort().at(0);
	}

	async function init(): Promise<void> {
		items.value = [];
		aheadQueue = [];
		queuedAheadItemsCount.value = 0;
		fetching.value = true;
		const params = props.ctx.params ? isRef(props.ctx.params) ? props.ctx.params.value : props.ctx.params : {};
		await misskeyApi<T[]>(props.ctx.endpoint, {
			...params,
			limit: props.ctx.limit ?? FIRST_FETCH_LIMIT,
			allowPartial: true,
		}).then(res => {
			for (let i = 0; i < res.length; i++) {
				const item = res[i];
				if (i === 3) item._shouldInsertAd_ = true;
			}

			if (res.length === 0 || props.ctx.noPaging) {
				pushItems(res);
				canFetchMore.value = false;
			} else {
				if (props.ctx.reversed) moreFetching.value = true;
				pushItems(res);
				canFetchMore.value = true;
			}

			error.value = false;
			fetching.value = false;
		}, err => {
			error.value = true;
			fetching.value = false;
		});
	}

	function reload(): Promise<void> {
		return init();
	}

	async function fetchOlder(): Promise<void> {
		if (!canFetchMore.value || fetching.value || moreFetching.value || items.value.length === 0) return;
		moreFetching.value = true;
		const params = props.ctx.params ? isRef(props.ctx.params) ? props.ctx.params.value : props.ctx.params : {};
		await misskeyApi<T[]>(props.ctx.endpoint, {
			...params,
			limit: SECOND_FETCH_LIMIT,
			...(props.ctx.offsetMode ? {
				offset: items.value.length,
			} : {
				untilId: getOldestId(),
			}),
		}).then(res => {
			for (let i = 0; i < res.length; i++) {
				const item = res[i];
				if (i === 10) item._shouldInsertAd_ = true;
			}

			if (res.length === 0) {
				canFetchMore.value = false;
				moreFetching.value = false;
			} else {
				items.value.push(...res);
				if (props.useShallowRef) triggerRef(items);
				canFetchMore.value = true;
				moreFetching.value = false;
			}
		}, err => {
			moreFetching.value = false;
		});
	}

	async function fetchNewer(options: {
		toQueue?: boolean;
	} = {}): Promise<void> {
		const params = props.ctx.params ? isRef(props.ctx.params) ? props.ctx.params.value : props.ctx.params : {};
		await misskeyApi<T[]>(props.ctx.endpoint, {
			...params,
			limit: SECOND_FETCH_LIMIT,
			...(props.ctx.offsetMode ? {
				offset: items.value.length,
			} : {
				sinceId: getNewestId(),
			}),
		}).then(res => {
			if (options.toQueue) {
				aheadQueue.unshift(...res.toReversed());
				if (aheadQueue.length > MAX_QUEUE_ITEMS) {
					aheadQueue = aheadQueue.slice(0, MAX_QUEUE_ITEMS);
				}
				queuedAheadItemsCount.value = aheadQueue.length;
			} else {
				items.value.unshift(...res.toReversed());
				if (props.useShallowRef) triggerRef(items);
			}
		});
	}

	function trim() {
		if (items.value.length >= MAX_ITEMS) canFetchMore.value = true;
		items.value = items.value.slice(0, MAX_ITEMS);
	}

	function unshiftItems(newItems: T[]) {
		items.value.unshift(...newItems);
		if (props.useShallowRef) triggerRef(items);
	}

	function pushItems(oldItems: T[]) {
		items.value.push(...oldItems);
		if (props.useShallowRef) triggerRef(items);
	}

	function prepend(item: T) {
		items.value.unshift(item);
		if (props.useShallowRef) triggerRef(items);
	}

	function enqueue(item: T) {
		aheadQueue.unshift(item);
		if (aheadQueue.length > MAX_QUEUE_ITEMS) {
			aheadQueue.pop();
		}
		queuedAheadItemsCount.value = aheadQueue.length;
	}

	function releaseQueue() {
		unshiftItems(aheadQueue);
		aheadQueue = [];
		queuedAheadItemsCount.value = 0;
	}

	onMounted(() => {
		init();
	});

	return {
		items,
		queuedAheadItemsCount,
		fetching,
		moreFetching,
		canFetchMore,
		init,
		reload,
		fetchOlder,
		fetchNewer,
		unshiftItems,
		prepend,
		trim,
		enqueue,
		releaseQueue,
		error,
	};
}
