<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition
	:enterActiveClass="defaultStore.state.animation ? $style.transition_fade_enterActive : ''"
	:leaveActiveClass="defaultStore.state.animation ? $style.transition_fade_leaveActive : ''"
	:enterFromClass="defaultStore.state.animation ? $style.transition_fade_enterFrom : ''"
	:leaveToClass="defaultStore.state.animation ? $style.transition_fade_leaveTo : ''"
	mode="out-in"
>
	<MkLoading v-if="initializing"/>

	<MkError v-else-if="error" @retry="init()"/>

	<div v-else-if="empty" key="_empty_" class="empty">
		<slot name="empty">
			<div class="_fullinfo">
				<img :src="infoImageUrl" class="_ghost"/>
				<div>{{ i18n.ts.nothing }}</div>
			</div>
		</slot>
	</div>

	<div v-else ref="rootEl">
		<div v-show="moreAhead" key="_more_" class="_margin">
			<MkButton
				v-if="!fetching" v-appear="(enableInfiniteScroll) ? appearFetchMoreAhead : null"
				:class="$style.more" :disabled="fetching" :style="{ cursor: fetching ? 'wait' : 'pointer' }"
				primary rounded @click="fetchMoreAhead"
			>
				{{ i18n.ts.loadMore }}
			</MkButton>
			<MkLoading v-else class="loading"/>
		</div>
		<div ref="itemsAreaEl">
			<slot :items="Array.from(items.values())" :fetching="initializing || fetching"></slot>
		</div>
		<div v-show="morePast" key="_more_" class="_margin">
			<MkButton
				v-if="!fetching" v-appear="(enableInfiniteScroll) ? appearFetchMore : null"
				:class="$style.more" :disabled="fetching" :style="{ cursor: fetching ? 'wait' : 'pointer' }"
				primary rounded @click="fetchMore"
			>
				{{ i18n.ts.loadMore }}
			</MkButton>
			<MkLoading v-else class="loading"/>
		</div>
	</div>
</Transition>
</template>

<script lang="ts">
import {
	computed,
	ComputedRef,
	isRef,
	nextTick,
	onActivated,
	onBeforeMount,
	onBeforeUnmount,
	onDeactivated,
	ref,
	shallowRef,
	watch,
} from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { getBodyScrollHeight, getScrollContainer, scroll, scrollToBottom } from '@/scripts/scroll.js';
import { defaultStore } from '@/store.js';
import { MisskeyEntity } from '@/types/date-separated-list.js';
import { i18n } from '@/i18n.js';

const APPEAR_MINIMUM_INTERVAL = 600;

export type Paging2<E extends keyof Misskey.Endpoints = keyof Misskey.Endpoints> = {
	endpoint: E;
	limit: number;
	params?: Misskey.Endpoints[E]['req'] | ComputedRef<Misskey.Endpoints[E]['req']>;

	/**
	 * 表示するページの範囲。これを逸脱したページのアイテムは破棄される
	 */
	pageRange?: number;

	pageEl?: HTMLElement;
};

type MisskeyEntityMap = Map<string, MisskeyEntity>;

type PagingResponse = {
	items: MisskeyEntity[];
	page: number;
	count: number;
	allPages: number;
	allCount: number;
}

function arrayToEntries(entities: MisskeyEntity[]): [string, MisskeyEntity][] {
	return entities.map(en => [en.id, en]);
}

</script>
<script lang="ts" setup>
import { infoImageUrl } from '@/instance.js';
import MkButton from '@/components/MkButton.vue';

const props = defineProps<{
	pagination: Paging2;
}>();

const rootEl = shallowRef<HTMLElement>();
const itemsAreaEl = shallowRef<HTMLElement>();

// 遡り中かどうか
const backed = ref(false);

/** 表示するアイテムのソース(最新が0番目) */
const items = ref<MisskeyEntityMap>(new Map());

/** 現在表示しているページ(過去方向) */
const pageMore = ref(1);

/** 現在表示しているページ(未来方向) */
const pageAhead = ref(1);

/** 各ページごとのアイテム（ID）を保持 */
const pageItems = new Map<number, MisskeyEntity['id'][]>();

/** 表示するページの範囲 */
const pageRange = props.pagination.pageRange ?? 5;

/** APIから取得したページ数の最大値 */
const pageLast = ref(1);

/** 初期化中かどうか（trueならMkLoadingで全て隠す）*/
const initializing = ref(true);

/** 読み込み中かどうか */
const fetching = ref(false);

/** 未来方向に読み込み可能かどうか */
const moreAhead = computed(() => pageAhead.value !== 1);

/** 過去方向に読み込み可能かどうか */
const morePast = computed(() => pageMore.value < pageLast.value);

const preventAppearFetchMore = ref(false);
const preventAppearFetchMoreTimer = ref<number | null>(null);
const isBackTop = ref(false);
const empty = computed(() => items.value.size === 0);
const error = ref(false);
const {
	enableInfiniteScroll,
} = defaultStore.reactiveState;

const contentEl = computed(() => props.pagination.pageEl ?? rootEl.value);
const scrollableElement = computed(() => contentEl.value ? getScrollContainer(contentEl.value) : document.body);

// 先頭が表示されているかどうかを検出
// https://qiita.com/mkataigi/items/0154aefd2223ce23398e
const scrollObserver = ref<IntersectionObserver>();

watch(scrollableElement, () => {
	if (scrollObserver.value) scrollObserver.value.disconnect();

	scrollObserver.value = new IntersectionObserver(entries => {
		console.log(entries);
		backed.value = entries[0].isIntersecting;
	}, {
		root: scrollableElement.value,
		rootMargin: '100% 0px -100% 0px',
		threshold: 0.01,
	});
}, { immediate: true });

watch(rootEl, () => {
	scrollObserver.value?.disconnect();
	nextTick(() => {
		if (rootEl.value) scrollObserver.value?.observe(rootEl.value);
	});
});

// パラメータに何らかの変更があった際、再読込したい（チャンネル等のIDが変わったなど）
watch(() => [props.pagination.endpoint, props.pagination.params], init, { deep: true });

/** 保持しているページング関係の値を使用してリクエストパラメータを構築し、リクエストを送る */
const fetch = async (params?: {
	direction?: 'more' | 'ahead';
}): Promise<PagingResponse & { empty: boolean }> => {
	const pagination = props.pagination;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let requestParams: any = {
		...(
			props.pagination.params
				? (isRef(pagination.params) ? pagination.params.value : pagination.params)
				: {}
		),
	};

	const limit = pagination.limit;
	switch (params?.direction) {
		case 'more': {
			requestParams = { ...requestParams, limit, page: pageMore.value + 1 };
			break;
		}
		case 'ahead': {
			requestParams = { ...requestParams, limit, page: pageAhead.value - 1 };
			break;
		}
		default: {
			requestParams = { ...requestParams, limit, page: 1 };
			break;
		}
	}

	return misskeyApi<PagingResponse>(props.pagination.endpoint, requestParams).then(res => {
		return {
			...res,
			empty: res.items.length === 0,
		};
	});
};

async function init(): Promise<void> {
	items.value = new Map();
	initializing.value = true;

	fetch().then(res => {
		updatePageItems('more', res);

		error.value = false;
		initializing.value = false;
	}, () => {
		error.value = true;
		initializing.value = false;
	});
}

/** 過去方向に追加読み込み */
const fetchMore = async (): Promise<void> => {
	if (_DEV_) console.log('fetchMore');

	if (!morePast.value || initializing.value || fetching.value || items.value.size === 0) return;
	fetching.value = true;

	const reverseConcat = (res: PagingResponse) => {
		const oldHeight = scrollableElement.value ? scrollableElement.value.scrollHeight : getBodyScrollHeight();
		const oldScroll = scrollableElement.value ? scrollableElement.value.scrollTop : window.scrollY;

		updatePageItems('more', res);

		return nextTick(() => {
			if (scrollableElement.value) {
				scroll(scrollableElement.value, {
					top: oldScroll + (scrollableElement.value.scrollHeight - oldHeight),
					behavior: 'instant',
				});
			} else {
				window.scroll({ top: oldScroll + (getBodyScrollHeight() - oldHeight), behavior: 'instant' });
			}

			return nextTick();
		});
	};

	await fetch({ direction: 'more' }).then(res => {
		updatePageItems('more', res);
		fetching.value = false;
	}, () => {
		fetching.value = false;
	});
};

/** 未来方向に追加読み込み */
const fetchMoreAhead = async (): Promise<void> => {
	if (_DEV_) console.log('fetchMoreAhead');

	if (!moreAhead.value || initializing.value || fetching.value || items.value.size === 0) return;
	fetching.value = true;

	fetch({ direction: 'ahead' }).then(res => {
		// アイテム1つ分の高さを計算（だいたいの高さ）
		const itemHeight = (itemsAreaEl.value?.scrollHeight ?? 0) / items.value.size || 1;
		const oldScroll = scrollableElement.value ? scrollableElement.value.scrollTop : window.scrollY;

		updatePageItems('ahead', res);

		nextTick(() => {
			if (scrollableElement.value) {
				scroll(scrollableElement.value, { top: oldScroll + (itemHeight * res.items.length), behavior: 'instant' });
			} else {
				window.scroll({ top: oldScroll + (itemHeight * res.items.length), behavior: 'instant' });
			}
		}).then(() => {
			fetching.value = false;
		});
	}, () => {
		fetching.value = false;
	});
};

/** ページが範囲内にあるかどうか */
const isPageInRange = (page: number): boolean => {
	// pageMoreとpageAheadの差がpageRange以下であれば範囲内
	return (pageMore.value - page) <= pageRange && (page - pageAhead.value) <= pageRange;
};

/** 取得したレスポンスを読み取ってページ関連の情報を更新 */
const updatePageItems = (direction: 'more' | 'ahead', res: PagingResponse) => {
	const entities = res.items;
	pageItems.set(res.page, entities.map(en => en.id));

	if (direction === 'more') {
		pageMore.value = res.page;
	} else {
		pageAhead.value = res.page;
	}

	pageLast.value = res.allPages;
	const newEntities = arrayToEntries(entities);

	// 保持する範囲を超えたページのアイテムを削除
	if (Math.abs(pageAhead.value - pageMore.value) > pageRange) {
		// 反対側のページを調節して範囲内に収める
		if (direction === 'more') {
			pageAhead.value = pageMore.value - pageRange;
		} else {
			pageMore.value = pageAhead.value + pageRange;
		}

		// 溢れたページの列挙
		const overflowPages = Array.from(pageItems.keys()).filter(it => !isPageInRange(it));
		if (_DEV_) console.log('overflowPages', overflowPages);

		// 溢れたページにあったIDを列挙してそれらを除外したもの＋受信したレスポンスの内容で新たな一覧を生成
		const overflowIds = overflowPages.flatMap(page => pageItems.get(page)).filter(it => it != null);
		items.value = new Map(
			(direction === 'more' ? [...items.value, ...newEntities] : [...newEntities, ...items.value])
				.filter(([id]) => !overflowIds.includes(id)),
		);

		for (const page of overflowPages) {
			pageItems.delete(page);
		}
	} else {
		items.value = new Map(
			(direction === 'more' ? [...items.value, ...newEntities] : [...newEntities, ...items.value]),
		);
	}
};

/**
 * Appear（IntersectionObserver）によってfetchMoreが呼ばれる場合、
 * APPEAR_MINIMUM_INTERVALミリ秒以内に2回fetchMoreが呼ばれるのを防ぐ
 */
const fetchMoreAppearTimeoutFn = (): void => {
	preventAppearFetchMore.value = false;
	preventAppearFetchMoreTimer.value = null;
};
const fetchMoreAppearTimeout = (): void => {
	preventAppearFetchMore.value = true;
	preventAppearFetchMoreTimer.value = window.setTimeout(fetchMoreAppearTimeoutFn, APPEAR_MINIMUM_INTERVAL);
};

const appearFetchMore = async (): Promise<void> => {
	if (preventAppearFetchMore.value) return;
	await fetchMore();
	fetchMoreAppearTimeout();
};

const appearFetchMoreAhead = async (): Promise<void> => {
	if (preventAppearFetchMore.value) return;
	await fetchMoreAhead();
	fetchMoreAppearTimeout();
};

onActivated(() => {
	isBackTop.value = false;
});

onDeactivated(() => {
	isBackTop.value = window.scrollY === 0;
});

function toBottom() {
	scrollToBottom(contentEl.value!);
}

onBeforeMount(() => {
	init();
});

onBeforeUnmount(() => {
	if (preventAppearFetchMoreTimer.value) {
		clearTimeout(preventAppearFetchMoreTimer.value);
		preventAppearFetchMoreTimer.value = null;
	}
	scrollObserver.value?.disconnect();
});
</script>

<style lang="scss" module>
.transition_fade_enterActive,
.transition_fade_leaveActive {
	transition: opacity 0.125s ease;
}

.transition_fade_enterFrom,
.transition_fade_leaveTo {
	opacity: 0;
}

.more {
	margin-left: auto;
	margin-right: auto;
}
</style>
