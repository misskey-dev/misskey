/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, isRef, nextTick, onActivated, onBeforeMount, onBeforeUnmount, onDeactivated, onUnmounted, ref, watch } from 'vue';
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

type MisskeyEntityMap = Map<string, MisskeyEntity>;

function arrayToEntries(entities: MisskeyEntity[]): [string, MisskeyEntity][] {
	return entities.map(en => [en.id, en]);
}

function concatMapWithArray(map: MisskeyEntityMap, entities: MisskeyEntity[]): MisskeyEntityMap {
	return new Map([...map, ...arrayToEntries(entities)]);
}

export function usePagination<T>(props: {
	ctx: PagingCtx;
}) {
	/**
	 * 表示するアイテムのソース
	 * 最新が0番目
	 */
	const items = ref<MisskeyEntityMap>(new Map());

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

	const reload = (): Promise<void> => {
		return init();
	};

	const fetchMore = async (): Promise<void> => {
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
				items.value = concatMapWithArray(items.value, res);
				canFetchMore.value = false;
				moreFetching.value = false;
			} else {
				items.value = concatMapWithArray(items.value, res);
				canFetchMore.value = true;
				moreFetching.value = false;
			}
		}, err => {
			moreFetching.value = false;
		});
	};

	const fetchMoreAhead = async (): Promise<void> => {
		if (!canFetchMore.value || fetching.value || moreFetching.value || items.value.size === 0) return;
		moreFetching.value = true;
		const params = props.ctx.params ? isRef(props.ctx.params) ? props.ctx.params.value : props.ctx.params : {};
		await misskeyApi<MisskeyEntity[]>(props.ctx.endpoint, {
			...params,
			limit: SECOND_FETCH_LIMIT,
			...(props.ctx.offsetMode ? {
				offset: items.value.size,
			} : {
				sinceId: Array.from(items.value.keys()).at(-1),
			}),
		}).then(res => {
			if (res.length === 0) {
				items.value = concatMapWithArray(items.value, res);
				canFetchMore.value = false;
			} else {
				items.value = concatMapWithArray(items.value, res);
				canFetchMore.value = true;
			}
			moreFetching.value = false;
		}, err => {
			moreFetching.value = false;
		});
	};

	/**
 * 新着アイテムをitemsの先頭に追加し、MAX_ITEMSを適用する
 * @param newItems 新しいアイテムの配列
 */
	function unshiftItems(newItems: MisskeyEntity[]) {
		const length = newItems.length + items.value.size;
		items.value = new Map([...arrayToEntries(newItems), ...items.value].slice(0, MAX_ITEMS));

		if (length >= MAX_ITEMS) canFetchMore.value = true;
	}

	/**
 * 古いアイテムをitemsの末尾に追加し、MAX_ITEMSを適用する
 * @param oldItems 古いアイテムの配列
 */
	function concatItems(oldItems: MisskeyEntity[]) {
		const length = oldItems.length + items.value.size;
		items.value = new Map([...items.value, ...arrayToEntries(oldItems)].slice(0, MAX_ITEMS));

		if (length >= MAX_ITEMS) canFetchMore.value = true;
	}

	/*
 * アイテムを末尾に追加する（使うの？）
 */
	const appendItem = (item: MisskeyEntity): void => {
		items.value.set(item.id, item);
	};

	const removeItem = (id: string) => {
		items.value.delete(id);
	};

	const updateItem = (id: MisskeyEntity['id'], replacer: (old: MisskeyEntity) => MisskeyEntity): void => {
		const item = items.value.get(id);
		if (item) items.value.set(id, replacer(item));
	};

	return {
		items,
		fetching,
		moreFetching,
		canFetchMore,
		init,
		reload,
		fetchMore,
		fetchMoreAhead,
		error,
	};
}
