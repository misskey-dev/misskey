<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
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
	<MkLoading v-if="fetching"/>

	<MkError v-else-if="error" @retry="reload()"/>

	<div v-else-if="empty" key="_empty_" class="empty">
		<slot name="empty">
			<div class="_fullinfo">
				<img :src="infoImageUrl" class="_ghost"/>
				<div>{{ i18n.ts.nothing }}</div>
			</div>
		</slot>
	</div>

	<div v-else ref="rootEl">
		<div v-show="pagination.reversed && more" key="_more_" class="_margin">
			<MkButton v-if="!moreFetching" v-appear="(enableInfiniteScroll && !props.disableAutoLoad) ? appearFetchMoreAhead : null" :class="$style.more" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }" primary rounded @click="fetchMoreAhead">
				{{ i18n.ts.loadMore }}
			</MkButton>
			<MkLoading v-else class="loading"/>
		</div>
		<slot :items="Array.from(items.values())" :fetching="fetching || moreFetching" :denyMoveTransition="denyMoveTransition"></slot>
		<div v-show="!pagination.reversed && more" key="_more_" class="_margin">
			<MkButton v-if="!moreFetching" v-appear="(enableInfiniteScroll && !props.disableAutoLoad) ? appearFetchMore : null" :class="$style.more" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }" primary rounded @click="fetchMore">
				{{ i18n.ts.loadMore }}
			</MkButton>
			<MkLoading v-else class="loading"/>
		</div>
	</div>
</Transition>
</template>

<script lang="ts">
import { computed, ComputedRef, isRef, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue';
import * as misskey from 'misskey-js';
import * as os from '@/os';
import { isBottomVisible, isTopVisible, getScrollContainer, scrollToBottom, scrollToTop, scrollBy, scroll, getBodyScrollHeight } from '@/scripts/scroll';
import { useDocumentVisibility } from '@/scripts/use-document-visibility';
import MkButton from '@/components/MkButton.vue';
import { defaultStore } from '@/store';
import { MisskeyEntity } from '@/types/date-separated-list';
import { i18n } from '@/i18n';
import { isWebKit } from '@/scripts/useragent';

const SECOND_FETCH_LIMIT = 30;
const TOLERANCE = 6;
const APPEAR_MINIMUM_INTERVAL = 600;

export type Paging<E extends keyof misskey.Endpoints = keyof misskey.Endpoints> = {
	endpoint: E;

	/**
	 * 一度にAPIへ取得する件数
	 */
	limit: number;

	/**
	 * タイムラインに表示する最大件数
	 */
	displayLimit?: number;

	params?: misskey.Endpoints[E]['req'] | ComputedRef<misskey.Endpoints[E]['req']>;

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

	pageEl?: HTMLElement;

	/**
	 * 変換関数
	 */
	transform?: (source: Omit<MisskeyEntity, '_shouldInsertAd_'>[]) => MisskeyEntity[];
};

type MisskeyEntityMap = Map<string, MisskeyEntity>;

function arrayToEntries(entities: MisskeyEntity[]): [string, MisskeyEntity][] {
	return entities.map(en => [en.id, en]);
}

function concatMapWithArray(map: MisskeyEntityMap, entities: MisskeyEntity[]): MisskeyEntityMap {
	return new Map([...map, ...arrayToEntries(entities)]);
}

const timelineBackTopBehavior = computed(() => isWebKit() ? 'newest' : defaultStore.reactiveState.timelineBackTopBehavior.value);
</script>
<script lang="ts" setup>
import { infoImageUrl } from '@/instance';

const props = withDefaults(defineProps<{
	pagination: Paging;
	disableAutoLoad?: boolean;
}>(), {
});

let rootEl = $shallowRef<HTMLElement>();

/**
 * スクロールが先頭にある場合はfalse
 * スクロールが先頭にない場合にtrue
 */
// 先頭にいるか（prependでキューに追加するかどうかの判定に使う）
let backed = $ref(false);
// true→falseの変更でexecuteQueueする
let weakBacked = $ref(false);

let scrollRemove = $ref<(() => void) | null>(null);

/**
 * 表示するアイテムのソース
 * 最新が0番目
 */
const items = ref<MisskeyEntityMap>(new Map());

/**
 * タブが非アクティブなどの場合に更新を貯めておく
 * 最新が最後（パフォーマンス上の理由でitemsと逆にした）
 */
const queue = ref<MisskeyEntityMap>(new Map());
const queueSize = computed(() => queue.value.size);

const offset = ref(0);

/**
 * 初期化中かどうか（trueならMkLoadingで全て隠す）
 */
const fetching = ref(true);

/**
 * onActivatedでtrue, onDeactivatedでfalseになる
 */
const active = ref(true);

const moreFetching = ref(false);
const more = ref(false);
const preventAppearFetchMore = ref(false);
const preventAppearFetchMoreTimer = ref<number | null>(null);
const empty = computed(() => items.value.size === 0);
const error = ref(false);
const {
	enableInfiniteScroll,
} = defaultStore.reactiveState;

const displayLimit = computed(() => props.pagination.displayLimit ?? props.pagination.limit * 2);

const contentEl = $computed(() => props.pagination.pageEl ?? rootEl);
const scrollableElement = $computed(() => contentEl ? getScrollContainer(contentEl) ?? null : null);
const scrollableElementOrHtml = $computed(() => scrollableElement ?? document.getElementsByName('html')[0]);

const visibility = useDocumentVisibility();

const isPausingUpdateByExecutingQueue = ref(false);
const denyMoveTransition = ref(false);

/**
 * 変換関数
 */
const transform = computed(() => props.pagination.transform ?? ((source: MisskeyEntity[]) => source));

//#region scrolling
const checkFn = props.pagination.reversed ? isBottomVisible : isTopVisible;
const checkTop = (tolerance?: number) => {
	if (!contentEl) return true;
	if (!document.body.contains(contentEl)) return true;
	return checkFn(contentEl, tolerance, scrollableElement);
};
/**
 * IntersectionObserverで大まかに検出
 * https://qiita.com/mkataigi/items/0154aefd2223ce23398e
 */
let scrollObserver = $ref<IntersectionObserver>();

watch([() => props.pagination.reversed, $$(scrollableElement)], () => {
	if (scrollObserver) scrollObserver.disconnect();

	scrollObserver = new IntersectionObserver(entries => {
		if (!active.value) return; // activeでない時は触らない
		weakBacked = entries[0].intersectionRatio >= 0.1;
	}, {
		root: scrollableElement,
		rootMargin: props.pagination.reversed ? '-100% 0px 1000% 0px' : '1000% 0px -100% 0px',
		threshold: [0.01, 0.05, 0.1, 0.12, 0.15],
	});
}, { immediate: true });

watch([$$(rootEl), $$(scrollObserver)], () => {
	scrollObserver?.disconnect();
	if (rootEl) scrollObserver?.observe(rootEl);
});

/**
 * weakBackedがtrue→falseになったらexecuteQueue
 */
watch($$(weakBacked), () => {
	if (timelineBackTopBehavior.value === 'next' && !weakBacked) {
		executeQueue();
	}
});

/**
 * backedがtrue→falseになってもexecuteQueue
 */
watch($$(backed), () => {
	if (!backed) {
		executeQueue();
	}
});

/**
 * onScrollTop/onScrollBottomでbackedを厳密に検出する
 */
watch([$$(weakBacked), $$(contentEl)], () => {
	if (scrollRemove) scrollRemove();
	scrollRemove = null;

	if (weakBacked || !contentEl) {
		if (weakBacked) backed = true;
		return;
	}

	scrollRemove = (() => {
		const checkBacked = () => {
			if (!active.value) return; // activeでない時は触らない
			backed = !checkTop(TOLERANCE);
		};

		// とりあえず評価してみる
		checkBacked();

		const container = scrollableElementOrHtml;

		function removeListener() { container.removeEventListener('scroll', checkBacked); }
		container.addEventListener('scroll', checkBacked, { passive: true });
		return removeListener;
	})();
});

function preventDefault(ev: Event) {
	ev.preventDefault();
}

/**
 * アイテムを上に追加した場合に追加分だけスクロールを下にずらす
 * Safariでは使わない方がいいかも？
 * @param fn DOM操作(unshiftItemsなど)
 */
async function adjustScroll(fn: () => void): Promise<void> {
	await nextTick();
	const oldHeight = scrollableElement ? scrollableElement.scrollHeight : getBodyScrollHeight();
	const oldScroll = scrollableElement ? scrollableElement.scrollTop : window.scrollY;
	// スクロールをやめさせる
	try {
		// なぜかscrollableElementOrHtmlがundefinedであるというエラーが出る
		scrollableElementOrHtml.addEventListener('wheel', preventDefault, { passive: false });
		scrollableElementOrHtml.addEventListener('touchmove', preventDefault, { passive: false });
		// スクロールを強制的に停止
		scroll(scrollableElement, { top: oldScroll, behavior: 'instant' });
	} catch (err) {
		console.error(err, { scrollableElementOrHtml });
	}
	denyMoveTransition.value = true;
	fn();
	return await nextTick().then(() => {
		const top = oldScroll + ((scrollableElement ? scrollableElement.scrollHeight : getBodyScrollHeight()) - oldHeight);
		scroll(scrollableElement, { top, behavior: 'instant' });
		// なぜかscrollableElementOrHtmlがundefinedであるというエラーが出る
		scrollableElementOrHtml.removeEventListener('wheel', preventDefault);
		scrollableElementOrHtml.removeEventListener('touchmove', preventDefault);
	}).then(() => nextTick()).finally(() => {
		denyMoveTransition.value = false;
	});
}
//#endregion

/**
 * 初期化
 * scrollAfterInitなどの後処理もあるので、reload関数を使うべき
 * 
 * 注意: moreFetchingをtrueにするのでfalseにする必要がある
 */
async function init(): Promise<void> {
	items.value = new Map();
	queue.value = new Map();
	fetching.value = true;
	const params = props.pagination.params ? isRef(props.pagination.params) ? props.pagination.params.value : props.pagination.params : {};
	await os.api(props.pagination.endpoint, {
		...params,
		limit: props.pagination.limit ?? 10,
	}).then(_res => {
		const res = transform.value(_res);

		for (let i = 0; i < res.length; i++) {
			const item = res[i];
			if (i === 3) item._shouldInsertAd_ = true;
		}

		if (res.length === 0 || props.pagination.noPaging) {
			concatItems(res);
			more.value = false;
		} else {
			moreFetching.value = true;
			concatItems(res);
			more.value = true;
		}

		offset.value = res.length;
		error.value = false;
		fetching.value = false;
	}, err => {
		error.value = true;
		fetching.value = false;
	});
}

/**
 * initの後に呼ぶ
 * コンポーネント作成直後でinitが呼ばれた時はonMountedで呼ばれる
 * reloadでinitが呼ばれた時はreload内でinitの後に呼ばれる
 */
function scrollAfterInit() {
	if (props.pagination.reversed) {
		nextTick(() => {
			setTimeout(async () => {
				if (contentEl) {
					scrollToBottom(contentEl);
					// scrollToしてもbacked周りがうまく動かないので手動で戻す必要がある
					weakBacked = false;
				}
			}, 200);

			// scrollToBottomでmoreFetchingボタンが画面外まで出るまで
			// more = trueを遅らせる
			setTimeout(() => {
				moreFetching.value = false;
			}, 2000);
		});
	} else {
		nextTick(() => {
			setTimeout(() => {
				scrollToTop(scrollableElement);
				// scrollToしてもbacked周りがうまく動かないので手動で戻す必要がある
				weakBacked = false;

				moreFetching.value = false;
			}, 200);
		});
	}
}

const reload = async (): Promise<void> => {
	await init();
	scrollAfterInit();
};

if (props.pagination.params && isRef(props.pagination.params)) {
	watch(props.pagination.params, reload, { deep: true });
}

const fetchMore = async (): Promise<void> => {
	if (!more.value || fetching.value || moreFetching.value || items.value.size === 0) return;
	moreFetching.value = true;
	const params = props.pagination.params ? isRef(props.pagination.params) ? props.pagination.params.value : props.pagination.params : {};
	await os.api(props.pagination.endpoint, {
		...params,
		limit: SECOND_FETCH_LIMIT,
		...(props.pagination.offsetMode ? {
			offset: offset.value,
		} : {
			untilId: Array.from(items.value.keys()).at(-1),
		}),
	}).then(_res => {
		const res = transform.value(_res);

		for (let i = 0; i < res.length; i++) {
			const item = res[i];
			if (i === 10) item._shouldInsertAd_ = true;
		}

		const reverseConcat = (_res) => adjustScroll(() => concatMapWithArray(items.value, _res));

		if (res.length === 0) {
			if (props.pagination.reversed) {
				reverseConcat(res);
				more.value = false;
				moreFetching.value = false;
			} else {
				items.value = concatMapWithArray(items.value, res);
				more.value = false;
				moreFetching.value = false;
			}
		} else {
			if (props.pagination.reversed) {
				reverseConcat(res);
				more.value = true;
				moreFetching.value = false;
			} else {
				items.value = concatMapWithArray(items.value, res);
				more.value = true;
				moreFetching.value = false;
			}
		}
		offset.value += res.length;
	}, err => {
		moreFetching.value = false;
	});
};

const fetchMoreAhead = async (): Promise<void> => {
	if (!more.value || fetching.value || moreFetching.value || items.value.size === 0) return;
	moreFetching.value = true;
	const params = props.pagination.params ? isRef(props.pagination.params) ? props.pagination.params.value : props.pagination.params : {};
	await os.api(props.pagination.endpoint, {
		...params,
		limit: SECOND_FETCH_LIMIT,
		...(props.pagination.offsetMode ? {
			offset: offset.value,
		} : {
			sinceId: Array.from(items.value.keys()).at(-1),
		}),
	}).then(_res => {
		if (_res.length === 0) {
			more.value = false;
		} else {
			const res = transform.value(_res);
			items.value = concatMapWithArray(items.value, res);
			more.value = true;
		}
		offset.value += _res.length;
		moreFetching.value = false;
	}, err => {
		moreFetching.value = false;
	});
};

/**
 * Appear（IntersectionObserver）によってfetchMoreが呼ばれる場合、
 * APPEAR_MINIMUM_INTERVALミリ秒以内に2回fetchMoreが呼ばれるのを防ぐ
 */
const fetchMoreApperTimeoutFn = (): void => {
	preventAppearFetchMore.value = false;
	preventAppearFetchMoreTimer.value = null;
};
const fetchMoreAppearTimeout = (): void => {
	preventAppearFetchMore.value = true;
	preventAppearFetchMoreTimer.value = window.setTimeout(fetchMoreApperTimeoutFn, APPEAR_MINIMUM_INTERVAL);
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
	nextTick(() => {
		active.value = true;
	});
});

onDeactivated(() => {
	active.value = false;
});

watch([active, visibility], () => {
	if (!backed && active.value && visibility.value === 'visible') {
		executeQueue();
	}
});

/**
 * 最新のものとして1つだけアイテムを追加する
 * ストリーミングから降ってきたアイテムはこれで追加する
 * @param item アイテム（transform前）
 */
const prepend = (_item: MisskeyEntity): void => {
	const item = transform.value([_item])[0];
	if (!item) return;

	if (items.value.size === 0) {
		items.value.set(item.id, item);
		fetching.value = false;
		return;
	}

	if (
		!isPausingUpdateByExecutingQueue.value && // スクロール調整中はキューに追加する
		visibility.value !== 'hidden' && // バックグラウンドの場合はキューに追加する
		queueSize.value === 0 && // キューに残っている場合はキューに追加する
		active.value // keepAliveで隠されている間はキューに追加する
	) {
		if (!backed) {
			// かなりスクロールの先頭にいる場合
			if (items.value.has(item.id)) return; // 既にタイムラインにある場合は何もしない
			unshiftItems([item]);
		} else if (timelineBackTopBehavior.value === 'next' && !weakBacked) {
			// ちょっと先頭にいる場合はスクロールを調整する
			prependQueue(item);
			executeQueue();
		} else {
			// 先頭にいない場合はキューに追加する
			prependQueue(item);
		}
	} else {
		prependQueue(item);
	}
};

/**
 * 新着アイテムをitemsの先頭に追加し、limitを適用する
 * @param newItems 新しいアイテムの配列
 * @param limit デフォルトはdisplayLimit
 */
function unshiftItems(newItems: MisskeyEntity[], limit = displayLimit.value) {
	const length = newItems.length + items.value.size;
	items.value = new Map([...arrayToEntries(newItems), ...(newItems.length >= limit ? [] : items.value)].slice(0, limit));

	if (length >= limit) more.value = true;
}

/**
 * 古いアイテムをitemsの末尾に追加し、displayLimitを適用する
 * @param oldItems 古いアイテムの配列
 */
function concatItems(oldItems: MisskeyEntity[]) {
	const length = oldItems.length + items.value.size;
	items.value = new Map([...items.value, ...arrayToEntries(oldItems)].slice(0, displayLimit.value));

	if (length >= displayLimit.value) more.value = true;
}

async function executeQueue() {
	if (queue.value.size === 0) return;
	if (isPausingUpdateByExecutingQueue.value) return;
	if (timelineBackTopBehavior.value === 'newest') {
		// Safariは最新のアイテムにするだけ
		const newItems = Array.from(queue.value.values()).slice(-1 * props.pagination.limit);
		unshiftItems(newItems);
		queue.value = new Map();
	} else {
		const queueArr = Array.from(queue.value.entries());
		queue.value = new Map(queueArr.slice(props.pagination.limit));
		const newItems = Array.from({ length: Math.min(queueArr.length, props.pagination.limit) }, (_, i) => queueArr[i][1]).reverse();
		isPausingUpdateByExecutingQueue.value = true;

		await adjustScroll(() => unshiftItems(newItems, Infinity));
		backed = true;

		denyMoveTransition.value = true;
		items.value = new Map([...items.value].slice(0, displayLimit.value));
		await nextTick();
		isPausingUpdateByExecutingQueue.value = false;
		denyMoveTransition.value = false;
	}
}

function prependQueue(newItem: MisskeyEntity) {
	queue.value.set(newItem.id, newItem);
}

/*
 * アイテムを末尾に追加する（使うの？）
 * @param item アイテム（transform前）
 */
const appendItem = (_item: MisskeyEntity): void => {
	const item = transform.value([_item])[0];
	if (!item) return;

	items.value.set(item.id, item);
};

const removeItem = (id: string) => {
	items.value.delete(id);
	queue.value.delete(id);
};

const updateItem = (id: MisskeyEntity['id'], replacer: (old: MisskeyEntity) => MisskeyEntity): void => {
	const item = items.value.get(id);
	if (item) items.value.set(id, replacer(item));

	const queueItem = queue.value.get(id);
	if (queueItem) queue.value.set(id, replacer(queueItem));
};

const inited = init();

onMounted(() => {
	active.value = true;
	inited.then(scrollAfterInit);
});

onBeforeUnmount(() => {
	if (preventAppearFetchMoreTimer.value) {
		clearTimeout(preventAppearFetchMoreTimer.value);
		preventAppearFetchMoreTimer.value = null;
	}
	scrollObserver?.disconnect();
	if (scrollRemove) scrollRemove();
});

defineExpose({
	items,
	queue,
	more,
	inited,
	queueSize,
	backed: $$(backed),
	reload,
	prepend,
	append: appendItem,
	removeItem,
	updateItem,
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
