<template>
<transition :name="$store.state.animation ? 'fade' : ''" mode="out-in">
	<MkLoading v-if="fetching"/>

	<MkError v-else-if="error" @retry="init()"/>

	<div v-else-if="empty" key="_empty_" class="empty">
		<slot name="empty">
			<div class="_fullinfo">
				<img src="https://xn--931a.moe/assets/info.jpg" class="_ghost"/>
				<div>{{ $ts.nothing }}</div>
			</div>
		</slot>
	</div>

	<div v-else ref="rootEl">
		<div v-if="pagination.reversed" v-show="more" key="_more_" class="cxiknjgy _gap">
			<MkButton v-if="!moreFetching" v-appear="(enableInfiniteScroll && !props.disableAutoLoad) ? fetchMore : null" class="button" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }" primary @click="fetchMore">
				{{ $ts.loadMore }}
			</MkButton>
			<MkLoading v-else class="loading"/>
		</div>
		<slot :items="items" :fetching="fetching || moreFetching" :itemsContainer="itemsContainer" :itemsContainerWrapped="itemsContainerWrapped"></slot>
		<div v-if="!pagination.reversed" v-show="more" key="_more_" class="cxiknjgy _gap">
			<MkButton v-if="!moreFetching" v-appear="(enableInfiniteScroll && !props.disableAutoLoad) ? fetchMore : null" class="button" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }" primary @click="fetchMore">
				{{ $ts.loadMore }}
			</MkButton>
			<MkLoading v-else class="loading"/>
		</div>
	</div>
</transition>
</template>

<script lang="ts">
import { computed, ComputedRef, isRef, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch, watchEffect } from 'vue';
import * as misskey from 'misskey-js';
import * as os from '@/os';
import { onScrollTop, isTopVisible, getBodyScrollHeight, getScrollContainer, onScrollBottom, scrollToBottom, scroll, isBottomVisible } from '@/scripts/scroll';
import MkButton from '@/components/ui/button.vue';
import { defaultStore } from '@/store';
import { MisskeyEntity } from '@/types/date-separated-list';

const SECOND_FETCH_LIMIT = 30;

export type Paging<E extends keyof misskey.Endpoints = keyof misskey.Endpoints> = {
	endpoint: E;
	limit: number;
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
};
</script>
<script lang="ts" setup>
const props = withDefaults(defineProps<{
	pagination: Paging;
	disableAutoLoad?: boolean;
	displayLimit?: number;
}>(), {
	displayLimit: 30,
});

const emit = defineEmits<{
	(e: 'queue', count: number): void;
}>();

let rootEl = $ref<HTMLElement>();

/*
 * itemsContainer: itemsの実体DOMsの親コンテナ(=v-forの直上)のHTMLElement
 *
 * IntersectionObserverを使用してスクロールのパフォーマンスを向上させるため必要
 * この中の最初の要素を評価するので、順番を反転したり変えたりしてはいけない
 * 
 * これがundefinedのままの場合はrootElにフォールバックする
 * つまりrootElがitemsの実体DOMsの親であるとする
 * 
 * 自動ロードやストリーミングでの追加がなければあまり関係ない
 */
let itemsContainer = $ref<HTMLElement | null>();
/*
 * date-separated-listとやり取りするために入れ子にしたオブジェクトを用意する
 * slotの中身から変数を直接書き込むことができないため
 */
const itemsContainerWrapped = { v: $$(itemsContainer) };

/*
 * 遡り中かどうか
 * ＝ (itemsContainer || rootEl).children.item(0) が画面内に入ったかどうか
 */
let backed = $ref(false);

let scrollRemove: (() => void) | null = $ref(null);

const items = ref<MisskeyEntity[]>([]);
const queue = ref<MisskeyEntity[]>([]);
const offset = ref(0);
const fetching = ref(true);
const moreFetching = ref(false);
const more = ref(false);
const isBackTop = ref(false);
const empty = computed(() => items.value.length === 0);
const error = ref(false);
const {
	enableInfiniteScroll
} = defaultStore.reactiveState;

let mounted = $ref(false);

const contentEl = $computed(() => props.pagination.pageEl || rootEl);
const scrollableElement = $computed(() => getScrollContainer(contentEl));

const observer = new IntersectionObserver(entries => {
	if (entries.some(entry => entry.isIntersecting)) {
		backed = false;
	} else {
		backed = true;
	}
});

watch([$$(itemsContainer), $$(rootEl)], observeLatestElement);
watch(items, observeLatestElement, { deep: true });

function observeLatestElement() {
	observer.disconnect();
	nextTick(() => {
		if (!mounted) return;
		const latestEl = (itemsContainer || rootEl)?.children.item(0);
		if (latestEl) observer.observe(latestEl);
	});
}

watch([$$(backed), $$(contentEl)], () => {
	if (!backed) {
		if (!contentEl) return;

		scrollRemove = (props.pagination.reversed ? onScrollBottom : onScrollTop)(contentEl, () => {
			if (queue.value.length === 0) return;
			for (const item of queue.value) {
				prepend(item, true);
			}
			queue.value = [];
		}, 16);
	} else {
		if (scrollRemove) scrollRemove();
		scrollRemove = null;
	}
});

if (props.pagination.params && isRef(props.pagination.params)) {
	watch(props.pagination.params, init, { deep: true });
}

watch(queue, (a, b) => {
	if (a.length === 0 && b.length === 0) return;
	emit('queue', queue.value.length);
}, { deep: true });

async function init(): Promise<void> {
	queue.value = [];
	fetching.value = true;
	const params = props.pagination.params ? isRef(props.pagination.params) ? props.pagination.params.value : props.pagination.params : {};
	await os.api(props.pagination.endpoint, {
		...params,
		limit: props.pagination.noPaging ? (props.pagination.limit || 10) : (props.pagination.limit || 10) + 1,
	}).then(res => {
		for (let i = 0; i < res.length; i++) {
			const item = res[i];
			if (i === 3) item._shouldInsertAd_ = true;
		}
		if (!props.pagination.noPaging && (res.length > (props.pagination.limit || 10))) {
			res.pop();
			if (props.pagination.reversed) moreFetching.value = true;
			items.value = res;
			more.value = true;
		} else {
			items.value = res;
			more.value = false;
		}
		offset.value = res.length;
		error.value = false;
		fetching.value = false;
	}, e => {
		error.value = true;
		fetching.value = false;
	});
};

const reload = (): Promise<void> => {
	items.value = [];
	return init();
};

const fetchMore = async (): Promise<void> => {
	if (!more.value || fetching.value || moreFetching.value || items.value.length === 0) return;
	moreFetching.value = true;
	const params = props.pagination.params ? isRef(props.pagination.params) ? props.pagination.params.value : props.pagination.params : {};
	await os.api(props.pagination.endpoint, {
		...params,
		limit: SECOND_FETCH_LIMIT + 1,
		...(props.pagination.offsetMode ? {
			offset: offset.value,
		} : {
			untilId: items.value[items.value.length - 1].id,
		}),
	}).then(res => {
		for (let i = 0; i < res.length; i++) {
			const item = res[i];
			if (i === 10) item._shouldInsertAd_ = true;
		}

		const reverseConcat = _res => {
			const oldHeight = scrollableElement ? scrollableElement.scrollHeight : getBodyScrollHeight();
			const oldScroll = scrollableElement ? scrollableElement.scrollTop : window.scrollY;

			items.value = items.value.concat(_res);

			return nextTick(() => {
				if (scrollableElement) {
					scroll(scrollableElement, { top: oldScroll + (scrollableElement.scrollHeight - oldHeight), behavior: 'instant' });
				} else {
					window.scroll({ top: oldScroll + (getBodyScrollHeight() - oldHeight), behavior: 'instant' });
				}

				return nextTick();
			});
		};

		if (res.length > SECOND_FETCH_LIMIT) {
			res.pop();

			if (props.pagination.reversed) {
				reverseConcat(res).then(() => {
					more.value = true;
					moreFetching.value = false;
				});
			} else {
				items.value = items.value.concat(res);
				more.value = true;
				moreFetching.value = false;
			}
		} else {
			if (props.pagination.reversed) {
				reverseConcat(res).then(() => {
					more.value = false;
					moreFetching.value = false;
				});
			} else {
				items.value = items.value.concat(res);
				more.value = false;
				moreFetching.value = false;
			}
		}
		offset.value += res.length;
	}, e => {
		moreFetching.value = false;
	});
};

const fetchMoreAhead = async (): Promise<void> => {
	if (!more.value || fetching.value || moreFetching.value || items.value.length === 0) return;
	moreFetching.value = true;
	const params = props.pagination.params ? isRef(props.pagination.params) ? props.pagination.params.value : props.pagination.params : {};
	await os.api(props.pagination.endpoint, {
		...params,
		limit: SECOND_FETCH_LIMIT + 1,
		...(props.pagination.offsetMode ? {
			offset: offset.value,
		} : {
			sinceId: items.value[items.value.length - 1].id,
		}),
	}).then(res => {
		if (res.length > SECOND_FETCH_LIMIT) {
			res.pop();
			items.value = items.value.concat(res);
			more.value = true;
		} else {
			items.value = items.value.concat(res) ;
			more.value = false;
		}
		offset.value += res.length;
		moreFetching.value = false;
	}, e => {
		moreFetching.value = false;
	});
};

const prepend = (item: MisskeyEntity, force = false): void => {
	// 初回表示時はunshiftだけでOK
	if (!rootEl) {
		items.value.unshift(item);
		return;
	}

	const isTop = isBackTop.value || (props.pagination.reversed ? isBottomVisible : isTopVisible)(contentEl);

	if (isTop || force) {
		// Prepend the item
		items.value.unshift(item);

		// オーバーフローしたら古いアイテムは捨てる
		if (items.value.length >= props.displayLimit) {
			// このやり方だとVue 3.2以降アニメーションが動かなくなる
			//this.items = items.value.slice(0, props.displayLimit);
			while (items.value.length >= props.displayLimit) {
				items.value.pop();
			}
			more.value = true;
		}
	} else {
		queue.value.push(item);
	}
};

const append = (item: MisskeyEntity): void => {
	items.value.push(item);
};

const updateItem = (id: MisskeyEntity['id'], replacer: (old: MisskeyEntity) => MisskeyEntity): void => {
	const i = items.value.findIndex(item => item.id === id);
	items.value[i] = replacer(items.value[i]);
};

const inited = init();

onActivated(() => {
	isBackTop.value = false;
});

onDeactivated(() => {
	isBackTop.value = props.pagination.reversed ? window.scrollY >= (rootEl ? rootEl?.scrollHeight - window.innerHeight : 0) : window.scrollY === 0;
});

function toBottom() {
	scrollToBottom(contentEl);
}

onMounted(() => {
	mounted = true;

	inited.then(() => {
		if (props.pagination.reversed) {
			nextTick(() => {
				setTimeout(toBottom, 800);

				// scrollToBottomでmoreFetchingボタンが画面外まで出るまで
				// more = trueを遅らせる
				setTimeout(() => {
					moreFetching.value = false;
				}, 2000);
			});
		}
	});
});

onBeforeUnmount(() => {
	observer.disconnect();
});

defineExpose({
	items,
	backed,
	more,
	inited,
	reload,
	fetchMoreAhead,
	prepend,
	append,
	updateItem,
});
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.cxiknjgy {
	> .button {
		margin-left: auto;
		margin-right: auto;
	}
}
</style>
