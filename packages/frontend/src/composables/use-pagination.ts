/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, isRef, onMounted, ref, shallowRef, triggerRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import type { ComputedRef, DeepReadonly, Ref, ShallowRef } from 'vue';
import { misskeyApi } from '@/utility/misskey-api.js';

const MAX_ITEMS = 30;
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

	offsetMode?: boolean;

	baseId?: MisskeyEntity['id'];
	direction?: 'newer' | 'older';

	// 一部のAPIはさらに遡れる場合でもパフォーマンス上の理由でlimit以下の結果を返す場合があり、その場合はsafe、それ以外はlimitにすることを推奨
	canFetchDetection?: 'safe' | 'limit';
};

export function usePagination<Endpoint extends keyof Misskey.Endpoints, T extends { id: string; } = (Misskey.Endpoints[Endpoint]['res'] extends (infer I)[] ? I extends { id: string } ? I : { id: string } : { id: string })>(props: {
	ctx: PagingCtx<Endpoint>;
	autoInit?: boolean;
	autoReInit?: boolean;
	useShallowRef?: boolean;
}) {
	const items = props.useShallowRef ? shallowRef<T[]>([]) : ref<T[]>([]);
	let aheadQueue: T[] = [];
	const queuedAheadItemsCount = ref(0);
	const fetching = ref(true);
	const fetchingOlder = ref(false);
	const canFetchOlder = ref(false);
	const error = ref(false);

	if (props.autoReInit !== false) {
		watch(() => [props.ctx.endpoint, props.ctx.params], init, { deep: true });
	}

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
			...(props.ctx.baseId && props.ctx.direction === 'newer' ? {
				sinceId: props.ctx.baseId,
			} : props.ctx.baseId && props.ctx.direction === 'older' ? {
				untilId: props.ctx.baseId,
			} : {}),
		}).then(res => {
			// 逆順で返ってくるので
			if (props.ctx.baseId && props.ctx.direction === 'newer') {
				res.reverse();
			}

			for (let i = 0; i < res.length; i++) {
				const item = res[i];
				if (i === 3) item._shouldInsertAd_ = true;
			}

			pushItems(res);

			if (props.ctx.canFetchDetection === 'limit') {
				if (res.length < FIRST_FETCH_LIMIT) {
					canFetchOlder.value = false;
				} else {
					canFetchOlder.value = true;
				}
			} else if (props.ctx.canFetchDetection === 'safe' || props.ctx.canFetchDetection == null) {
				if (res.length === 0 || props.ctx.noPaging) {
					canFetchOlder.value = false;
				} else {
					canFetchOlder.value = true;
				}
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
		if (!canFetchOlder.value || fetching.value || fetchingOlder.value || items.value.length === 0) return;
		fetchingOlder.value = true;
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

			pushItems(res);

			if (props.ctx.canFetchDetection === 'limit') {
				if (res.length < FIRST_FETCH_LIMIT) {
					canFetchOlder.value = false;
				} else {
					canFetchOlder.value = true;
				}
			} else if (props.ctx.canFetchDetection === 'safe' || props.ctx.canFetchDetection == null) {
				if (res.length === 0) {
					canFetchOlder.value = false;
				} else {
					canFetchOlder.value = true;
				}
			}
		}).finally(() => {
			fetchingOlder.value = false;
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
			if (res.length === 0) return; // これやらないと余計なre-renderが走る

			if (options.toQueue) {
				aheadQueue.unshift(...res.toReversed());
				if (aheadQueue.length > MAX_QUEUE_ITEMS) {
					aheadQueue = aheadQueue.slice(0, MAX_QUEUE_ITEMS);
				}
				queuedAheadItemsCount.value = aheadQueue.length;
			} else {
				unshiftItems(res.toReversed());
			}
		});
	}

	function trim(trigger = true) {
		if (items.value.length >= MAX_ITEMS) canFetchOlder.value = true;
		items.value = items.value.slice(0, MAX_ITEMS);
		if (props.useShallowRef && trigger) triggerRef(items);
	}

	function unshiftItems(newItems: T[]) {
		if (newItems.length === 0) return; // これやらないと余計なre-renderが走る
		items.value.unshift(...newItems.filter(x => !items.value.some(y => y.id === x.id))); // ストリーミングやポーリングのタイミングによっては重複することがあるため
		trim(false);
		if (props.useShallowRef) triggerRef(items);
	}

	function pushItems(oldItems: T[]) {
		if (oldItems.length === 0) return; // これやらないと余計なre-renderが走る
		items.value.push(...oldItems);
		if (props.useShallowRef) triggerRef(items);
	}

	function prepend(item: T) {
		if (items.value.some(x => x.id === item.id)) return;
		items.value.unshift(item);
		trim(false);
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
		if (aheadQueue.length === 0) return; // これやらないと余計なre-renderが走る
		unshiftItems(aheadQueue);
		aheadQueue = [];
		queuedAheadItemsCount.value = 0;
	}

	function removeItem(id: string) {
		// TODO: queueからも消す

		const index = items.value.findIndex(x => x.id === id);
		if (index !== -1) {
			items.value.splice(index, 1);
			if (props.useShallowRef) triggerRef(items);
		}
	}

	function updateItem(id: string, updator: (item: T) => T) {
		// TODO: queueのも更新

		const index = items.value.findIndex(x => x.id === id);
		if (index !== -1) {
			const item = items.value[index]!;
			items.value[index] = updator(item);
			if (props.useShallowRef) triggerRef(items);
		}
	}

	if (props.autoInit !== false) {
		onMounted(() => {
			init();
		});
	}

	return {
		items: items as DeepReadonly<ShallowRef<T[]>>,
		queuedAheadItemsCount,
		fetching,
		fetchingOlder,
		canFetchOlder,
		init,
		reload,
		fetchOlder,
		fetchNewer,
		unshiftItems,
		prepend,
		trim,
		removeItem,
		updateItem,
		enqueue,
		releaseQueue,
		error,
	};
}
