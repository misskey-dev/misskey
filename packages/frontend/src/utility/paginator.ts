/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, shallowRef, triggerRef } from 'vue';
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

export class Paginator<Endpoint extends keyof Misskey.Endpoints = keyof Misskey.Endpoints, T extends { id: string; } = (Misskey.Endpoints[Endpoint]['res'] extends (infer I)[] ? I extends { id: string } ? I : { id: string } : { id: string })> {
	/**
	 * 外部から直接操作しないでください
	 */
	public items: ShallowRef<T[]> | Ref<T[]>;

	public queuedAheadItemsCount = ref(0);
	public fetching = ref(true);
	public fetchingOlder = ref(false);
	public fetchingNewer = ref(false);
	public canFetchOlder = ref(false);
	public canSearch = false;
	public error = ref(false);
	private endpoint: Endpoint;
	private limit: number;
	private params: Misskey.Endpoints[Endpoint]['req'] | (() => Misskey.Endpoints[Endpoint]['req']);
	public computedParams: ComputedRef<Misskey.Endpoints[Endpoint]['req']> | null;
	public initialId: MisskeyEntity['id'] | null = null;
	public initialDate: number | null = null;
	public initialDirection: 'newer' | 'older';
	private offsetMode: boolean;
	public noPaging: boolean;
	public searchQuery = ref<null | string>('');
	private searchParamName: string;
	private canFetchDetection: 'safe' | 'limit' | null = null;
	private aheadQueue: T[] = [];
	private useShallowRef: boolean;

	// 配列内の要素をどのような順序で並べるか
	// newest: 新しいものが先頭 (default)
	// oldest: 古いものが先頭
	// NOTE: このようなプロパティを用意してこっち側で並びを管理せずに、Setで持っておき参照者側が好きに並び変えるような設計の方がすっきりしそうなものの、Vueのレンダリングのたびに並び替え処理が発生することになったりしそうでパフォーマンス上の懸念がある
	public order: Ref<'newest' | 'oldest'>;

	constructor(endpoint: Endpoint, props: {
		limit?: number;
		params?: Misskey.Endpoints[Endpoint]['req'] | (() => Misskey.Endpoints[Endpoint]['req']);
		computedParams?: ComputedRef<Misskey.Endpoints[Endpoint]['req']>;

		/**
		 * 検索APIのような、ページング不可なエンドポイントを利用する場合
		 * (そのようなAPIをこの関数で使うのは若干矛盾してるけど)
		 */
		noPaging?: boolean;

		offsetMode?: boolean;

		initialId?: MisskeyEntity['id'];
		initialDate?: number | null;
		initialDirection?: 'newer' | 'older';
		order?: 'newest' | 'oldest';

		// 一部のAPIはさらに遡れる場合でもパフォーマンス上の理由でlimit以下の結果を返す場合があり、その場合はsafe、それ以外はlimitにすることを推奨
		canFetchDetection?: 'safe' | 'limit';

		useShallowRef?: boolean;

		canSearch?: boolean;
		searchParamName?: keyof Misskey.Endpoints[Endpoint]['req'];
	}) {
		this.endpoint = endpoint;
		this.useShallowRef = props.useShallowRef ?? false;
		this.items = this.useShallowRef ? shallowRef([] as T[]) : ref([] as T[]);
		this.limit = props.limit ?? FIRST_FETCH_LIMIT;
		this.params = props.params ?? {};
		this.computedParams = props.computedParams ?? null;
		this.order = ref(props.order ?? 'newest');
		this.initialId = props.initialId ?? null;
		this.initialDate = props.initialDate ?? null;
		this.initialDirection = props.initialDirection ?? 'older';
		this.canFetchDetection = props.canFetchDetection ?? null;
		this.noPaging = props.noPaging ?? false;
		this.offsetMode = props.offsetMode ?? false;
		this.canSearch = props.canSearch ?? false;
		this.searchParamName = props.searchParamName ?? 'search';

		this.getNewestId = this.getNewestId.bind(this);
		this.getOldestId = this.getOldestId.bind(this);
		this.init = this.init.bind(this);
		this.reload = this.reload.bind(this);
		this.fetchOlder = this.fetchOlder.bind(this);
		this.fetchNewer = this.fetchNewer.bind(this);
		this.unshiftItems = this.unshiftItems.bind(this);
		this.pushItems = this.pushItems.bind(this);
		this.prepend = this.prepend.bind(this);
		this.enqueue = this.enqueue.bind(this);
		this.releaseQueue = this.releaseQueue.bind(this);
		this.removeItem = this.removeItem.bind(this);
		this.updateItem = this.updateItem.bind(this);
	}

	private getNewestId(): string | null | undefined {
		// 様々な要因により並び順は保証されないのでソートが必要
		if (this.aheadQueue.length > 0) {
			return this.aheadQueue.map(x => x.id).sort().at(-1);
		}
		return this.items.value.map(x => x.id).sort().at(-1);
	}

	private getOldestId(): string | null | undefined {
		// 様々な要因により並び順は保証されないのでソートが必要
		return this.items.value.map(x => x.id).sort().at(0);
	}

	public async init(): Promise<void> {
		this.items.value = [];
		this.aheadQueue = [];
		this.queuedAheadItemsCount.value = 0;
		this.fetching.value = true;

		await misskeyApi<T[]>(this.endpoint, {
			...(typeof this.params === 'function' ? this.params() : this.params),
			...(this.computedParams ? this.computedParams.value : {}),
			...(this.searchQuery.value != null && this.searchQuery.value.trim() !== '' ? { [this.searchParamName]: this.searchQuery.value } : {}),
			limit: this.limit ?? FIRST_FETCH_LIMIT,
			allowPartial: true,
			...((this.initialId == null && this.initialDate == null) && this.initialDirection === 'newer' ? {
				sinceId: '0',
			} : this.initialDirection === 'newer' ? {
				sinceId: this.initialId ?? undefined,
				sinceDate: this.initialDate ?? undefined,
			} : (this.initialId || this.initialDate) && this.initialDirection === 'older' ? {
				untilId: this.initialId ?? undefined,
				untilDate: this.initialDate ?? undefined,
			} : {}),
		}).then(res => {
			// 逆順で返ってくるので
			if ((this.initialId || this.initialDate) && this.initialDirection === 'newer') {
				res.reverse();
			}

			for (let i = 0; i < res.length; i++) {
				const item = res[i];
				if (i === 3) item._shouldInsertAd_ = true;
			}

			this.pushItems(res);

			if (this.canFetchDetection === 'limit') {
				if (res.length < FIRST_FETCH_LIMIT) {
					this.canFetchOlder.value = false;
				} else {
					this.canFetchOlder.value = true;
				}
			} else if (this.canFetchDetection === 'safe' || this.canFetchDetection == null) {
				if (res.length === 0 || this.noPaging) {
					this.canFetchOlder.value = false;
				} else {
					this.canFetchOlder.value = true;
				}
			}

			this.error.value = false;
			this.fetching.value = false;
		}, err => {
			this.error.value = true;
			this.fetching.value = false;
		});
	}

	public reload(): Promise<void> {
		return this.init();
	}

	public async fetchOlder(): Promise<void> {
		if (!this.canFetchOlder.value || this.fetching.value || this.fetchingOlder.value || this.items.value.length === 0) return;
		this.fetchingOlder.value = true;
		await misskeyApi<T[]>(this.endpoint, {
			...(typeof this.params === 'function' ? this.params() : this.params),
			...(this.computedParams ? this.computedParams.value : {}),
			...(this.searchQuery.value != null && this.searchQuery.value.trim() !== '' ? { [this.searchParamName]: this.searchQuery.value } : {}),
			limit: SECOND_FETCH_LIMIT,
			...(this.offsetMode ? {
				offset: this.items.value.length,
			} : {
				untilId: this.getOldestId(),
			}),
		}).then(res => {
			for (let i = 0; i < res.length; i++) {
				const item = res[i];
				if (i === 10) item._shouldInsertAd_ = true;
			}

			this.pushItems(res);

			if (this.canFetchDetection === 'limit') {
				if (res.length < FIRST_FETCH_LIMIT) {
					this.canFetchOlder.value = false;
				} else {
					this.canFetchOlder.value = true;
				}
			} else if (this.canFetchDetection === 'safe' || this.canFetchDetection == null) {
				if (res.length === 0) {
					this.canFetchOlder.value = false;
				} else {
					this.canFetchOlder.value = true;
				}
			}
		}).finally(() => {
			this.fetchingOlder.value = false;
		});
	}

	public async fetchNewer(options: {
		toQueue?: boolean;
	} = {}): Promise<void> {
		this.fetchingNewer.value = true;
		await misskeyApi<T[]>(this.endpoint, {
			...(typeof this.params === 'function' ? this.params() : this.params),
			...(this.computedParams ? this.computedParams.value : {}),
			...(this.searchQuery.value != null && this.searchQuery.value.trim() !== '' ? { [this.searchParamName]: this.searchQuery.value } : {}),
			limit: SECOND_FETCH_LIMIT,
			...(this.offsetMode ? {
				offset: this.items.value.length,
			} : {
				sinceId: this.getNewestId(),
			}),
		}).then(res => {
			if (res.length === 0) return; // これやらないと余計なre-renderが走る

			if (options.toQueue) {
				this.aheadQueue.unshift(...res.toReversed());
				if (this.aheadQueue.length > MAX_QUEUE_ITEMS) {
					this.aheadQueue = this.aheadQueue.slice(0, MAX_QUEUE_ITEMS);
				}
				this.queuedAheadItemsCount.value = this.aheadQueue.length;
			} else {
				if (this.order.value === 'oldest') {
					this.pushItems(res);
				} else {
					this.unshiftItems(res.toReversed());
				}
			}
		}).finally(() => {
			this.fetchingNewer.value = false;
		});
	}

	public trim(trigger = true): void {
		if (this.items.value.length >= MAX_ITEMS) this.canFetchOlder.value = true;
		this.items.value = this.items.value.slice(0, MAX_ITEMS);
		if (this.useShallowRef && trigger) triggerRef(this.items);
	}

	public unshiftItems(newItems: T[]): void {
		if (newItems.length === 0) return; // これやらないと余計なre-renderが走る
		this.items.value.unshift(...newItems.filter(x => !this.items.value.some(y => y.id === x.id))); // ストリーミングやポーリングのタイミングによっては重複することがあるため
		this.trim(false);
		if (this.useShallowRef) triggerRef(this.items);
	}

	public pushItems(oldItems: T[]): void {
		if (oldItems.length === 0) return; // これやらないと余計なre-renderが走る
		this.items.value.push(...oldItems);
		if (this.useShallowRef) triggerRef(this.items);
	}

	public prepend(item: T): void {
		if (this.items.value.some(x => x.id === item.id)) return;
		this.items.value.unshift(item);
		this.trim(false);
		if (this.useShallowRef) triggerRef(this.items);
	}

	public enqueue(item: T): void {
		this.aheadQueue.unshift(item);
		if (this.aheadQueue.length > MAX_QUEUE_ITEMS) {
			this.aheadQueue.pop();
		}
		this.queuedAheadItemsCount.value = this.aheadQueue.length;
	}

	public releaseQueue(): void {
		if (this.aheadQueue.length === 0) return; // これやらないと余計なre-renderが走る
		this.unshiftItems(this.aheadQueue);
		this.aheadQueue = [];
		this.queuedAheadItemsCount.value = 0;
	}

	public removeItem(id: string): void {
		// TODO: queueからも消す

		const index = this.items.value.findIndex(x => x.id === id);
		if (index !== -1) {
			this.items.value.splice(index, 1);
			if (this.useShallowRef) triggerRef(this.items);
		}
	}

	public updateItem(id: string, updator: (item: T) => T): void {
		// TODO: queueのも更新

		const index = this.items.value.findIndex(x => x.id === id);
		if (index !== -1) {
			const item = this.items.value[index]!;
			this.items.value[index] = updator(item);
			if (this.useShallowRef) triggerRef(this.items);
		}
	}
}
