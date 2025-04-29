/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, isRef, onMounted, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import type { ComputedRef, Ref, ShallowRef } from 'vue';
import { misskeyApi } from '@/utility/misskey-api.js';

const MAX_ITEMS = 20;
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

function arrayToEntries(entities: MisskeyEntity[]): [string, MisskeyEntity][] {
	return entities.map(en => [en.id, en]);
}

export function usePagination<Ctx extends PagingCtx, T = Misskey.Endpoints[Ctx['endpoint']]['res']>(props: {
	ctx: Ctx;
}) {
	/**
	 * 表示するアイテムのソース
	 * 最新が0番目
	 */
	const items = ref<Map<string, T>>(new Map());

	const queue = ref<T[]>([]);

	/**
	 * 初期化中かどうか（trueならMkLoadingで全て隠す）
	 */
	const fetching = ref(true);

	const moreFetching = ref(false);
	const canFetchMore = ref(false);
	const error = ref(false);

	// パラメータに何らかの変更があった際、再読込したい（チャンネル等のIDが変わったなど）
	watch(() => [props.ctx.endpoint, props.ctx.params], init, { deep: true });

	async function init(): Promise<void> {
		items.value = new Map();
		fetching.value = true;
		const params = props.ctx.params ? isRef(props.ctx.params) ? props.ctx.params.value : props.ctx.params : {};
		await misskeyApi<MisskeyEntity[]>(props.ctx.endpoint, {
			...params,
			limit: props.ctx.limit ?? FIRST_FETCH_LIMIT,
			allowPartial: true,
		}).then(res => {
			for (let i = 0; i < res.length; i++) {
				const item = res[i];
				if (i === 3) item._shouldInsertAd_ = true;
			}

			if (res.length === 0 || props.ctx.noPaging) {
				concatItems(res);
				canFetchMore.value = false;
			} else {
				if (props.ctx.reversed) moreFetching.value = true;
				concatItems(res);
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
		if (!canFetchMore.value || fetching.value || moreFetching.value || items.value.size === 0) return;
		moreFetching.value = true;
		const params = props.ctx.params ? isRef(props.ctx.params) ? props.ctx.params.value : props.ctx.params : {};
		await misskeyApi<MisskeyEntity[]>(props.ctx.endpoint, {
			...params,
			limit: SECOND_FETCH_LIMIT,
			...(props.ctx.offsetMode ? {
				offset: items.value.size,
			} : {
				untilId: Array.from(items.value.keys()).at(-1),
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
				items.value = new Map([...items.value, ...arrayToEntries(res)]);
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
		await misskeyApi<MisskeyEntity[]>(props.ctx.endpoint, {
			...params,
			limit: SECOND_FETCH_LIMIT,
			...(props.ctx.offsetMode ? {
				offset: items.value.size,
			} : {
				sinceId: Array.from(items.value.keys()).at(0),
			}),
		}).then(res => {
			if (options.toQueue) {
				queue.value.unshift(...res.toReversed());
			} else {
				items.value = new Map([...arrayToEntries(res.toReversed()), ...items.value]);
			}
		});
	}

	function trim() {
		if (items.value.size >= MAX_ITEMS) canFetchMore.value = true;
		items.value = new Map([...items.value].slice(0, MAX_ITEMS));
	}

	function unshiftItems(newItems: T[]) {
		items.value = new Map([...arrayToEntries(newItems), ...items.value]);
	}

	function concatItems(oldItems: T[]) {
		items.value = new Map([...items.value, ...arrayToEntries(oldItems)]);
	}

	function prepend(item: T) {
		unshiftItems([item]);
	}

	function enqueue(item: T) {
		queue.value.unshift(item);
	}

	function releaseQueue() {
		unshiftItems(queue.value);
		queue.value = [];
	}

	onMounted(() => {
		init();
	});

	return {
		items,
		queue,
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
