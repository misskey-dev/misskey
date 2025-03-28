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
	<MkLoading v-if="fetching"/>

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
		<div v-show="pagination.prepend && more" key="_more_" class="_margin">
			<MkButton v-if="!moreFetching" v-appear="(enableInfiniteScroll && !props.disableAutoLoad) ? fetchMoreAhead : null" :class="$style.more" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }" primary rounded @click="fetchMoreAhead">
				{{ i18n.ts.loadMore }}
			</MkButton>
			<MkLoading v-else class="loading"/>
		</div>
		<slot :items="items" :fetching="fetching || moreFetching"></slot>
		<div v-show="!pagination.prepend && more" key="_more_" class="_margin">
			<MkButton v-if="!moreFetching" v-appear="(enableInfiniteScroll && !props.disableAutoLoad) ? fetchMore : null" :class="$style.more" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }" primary rounded @click="fetchMore">
				{{ i18n.ts.loadMore }}
			</MkButton>
			<MkLoading v-else class="loading"/>
		</div>
	</div>
</Transition>
</template>

<script lang="ts">
import { computed, ComputedRef, isRef, nextTick, onActivated, onBeforeMount, onBeforeUnmount, onDeactivated, ref, shallowRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { onScrollTop, isTopVisible, getBodyScrollHeight, getScrollContainer, onScrollBottom, scrollToBottom, scroll, isBottomVisible } from '@/scripts/scroll.js';
import { useDocumentVisibility } from '@/scripts/use-document-visibility.js';
import { defaultStore } from '@/store.js';
import { MisskeyEntity } from '@/types/date-separated-list.js';
import { i18n } from '@/i18n.js';

const SECOND_FETCH_LIMIT = 30;
const TOLERANCE = 16;

export type Paging<E extends keyof Misskey.Endpoints = keyof Misskey.Endpoints> = {
	endpoint: E;
	limit: number;
	params?: Misskey.Endpoints[E]['req'] | ComputedRef<Misskey.Endpoints[E]['req']>;

	/**
	 * 検索APIのような、ページング不可なエンドポイントを利用する場合
	 * (そのようなAPIをこの関数で使うのは若干矛盾してるけど)
	 */
	noPaging?: boolean;

	/**
	 * fetchの際に、 items 配列を上方向に追加していく（append, prepend等の関数には影響しない）
	 */
	prepend?: boolean;

	offsetMode?: boolean;

	pageEl?: HTMLElement;
};
</script>
<script lang="ts" setup>
import { infoImageUrl } from '@/instance.js';
import MkButton from '@/components/MkButton.vue';

const props = withDefaults(defineProps<{
	pagination: Paging;
	disableAutoLoad?: boolean;
	displayLimit?: number;
	filter?: (item: MisskeyEntity) => boolean;
}>(), {
	displayLimit: 20,
});

const emit = defineEmits<{
	(ev: 'queue', count: number): void;
	(ev: 'status', error: boolean): void;
}>();

const rootEl = shallowRef<HTMLElement>();

// 遡り中かどうか
const backed = ref(false);

const scrollRemove = ref<(() => void) | null>(null);

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
	enableInfiniteScroll,
} = defaultStore.reactiveState;

const contentEl = computed(() => props.pagination.pageEl ?? rootEl.value);
const scrollableElement = computed(() => getScrollContainer(contentEl.value));

const visibility = useDocumentVisibility();

let isPausingUpdate = false;
let timerForSetPause: number | null = null;
const BACKGROUND_PAUSE_WAIT_SEC = 10;

// 先頭が表示されているかどうかを検出
// https://qiita.com/mkataigi/items/0154aefd2223ce23398e
const scrollObserver = ref<IntersectionObserver>();

watch([() => props.pagination.prepend, scrollableElement], () => {
	if (scrollObserver.value) scrollObserver.value.disconnect();

	scrollObserver.value = new IntersectionObserver(entries => {
		backed.value = entries[0].isIntersecting;
	}, {
		root: scrollableElement.value,
		rootMargin: props.pagination.prepend ? '-100% 0px 100% 0px' : '100% 0px -100% 0px',
		threshold: 0.01,
	});
}, { immediate: true });

watch(rootEl, () => {
	scrollObserver.value?.disconnect();
	nextTick(() => {
		if (rootEl.value) scrollObserver.value?.observe(rootEl.value);
	});
});

watch([backed, contentEl], () => {
	if (!backed.value) {
		if (!contentEl.value) return;

		scrollRemove.value = (props.pagination.prepend ? onScrollBottom : onScrollTop)(contentEl.value, executeQueue, TOLERANCE);
	} else {
		if (scrollRemove.value) scrollRemove.value();
		scrollRemove.value = null;
	}
});

// パラメータに何らかの変更があった際、再読込したい（チャンネル等のIDが変わったなど）
watch(() => [props.pagination.endpoint, props.pagination.params], init, { deep: true });

watch(queue, (a, b) => {
	if (a.length === 0 && b.length === 0) return;
	emit('queue', queue.value.length);
}, { deep: true });

watch(error, (n, o) => {
	if (n === o) return;
	emit('status', n);
});

async function init(): Promise<void> {
	queue.value = [];
	fetching.value = true;
	const params = props.pagination.params ? isRef(props.pagination.params) ? props.pagination.params.value : props.pagination.params : {};
	await misskeyApi<MisskeyEntity[]>(props.pagination.endpoint, {
		...params,
		limit: props.pagination.limit ?? 10,
		allowPartial: true,
	}).then(res => {
		res = res.filter(item => !props.filter || props.filter(item));

		for (let i = 0; i < res.length; i++) {
			const item = res[i];
			if (i === 3) item._shouldInsertAd_ = true;
		}

		if (res.length === 0 || props.pagination.noPaging) {
			items.value = res;
			more.value = false;
		} else {
			if (props.pagination.prepend) moreFetching.value = true;
			items.value = res;
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

const reload = (): Promise<void> => {
	items.value = [];
	return init();
};

const deleteItem = () => {
	items.value = [];
};

const fetchMore = async (): Promise<void> => {
	if (!more.value || fetching.value || moreFetching.value || items.value.length === 0) return;
	moreFetching.value = true;
	const params = props.pagination.params ? isRef(props.pagination.params) ? props.pagination.params.value : props.pagination.params : {};
	await misskeyApi<MisskeyEntity[]>(props.pagination.endpoint, {
		...params,
		limit: SECOND_FETCH_LIMIT,
		...(props.pagination.offsetMode ? {
			offset: offset.value,
		} : {
			untilId: items.value[items.value.length - 1].id,
		}),
	}).then(res => {
		res = res.filter(item => !props.filter || props.filter(item));

		for (let i = 0; i < res.length; i++) {
			const item = res[i];
			if (i === 10) item._shouldInsertAd_ = true;
		}

		const reverseConcat = _res => {
			const oldHeight = scrollableElement.value ? scrollableElement.value.scrollHeight : getBodyScrollHeight();
			const oldScroll = scrollableElement.value ? scrollableElement.value.scrollTop : window.scrollY;

			items.value = items.value.concat(_res);

			return nextTick(() => {
				if (scrollableElement.value) {
					scroll(scrollableElement.value, { top: oldScroll + (scrollableElement.value.scrollHeight - oldHeight), behavior: 'instant' });
				} else {
					window.scroll({ top: oldScroll + (getBodyScrollHeight() - oldHeight), behavior: 'instant' });
				}

				return nextTick();
			});
		};

		if (res.length === 0) {
			if (props.pagination.prepend) {
				reverseConcat(res).then(() => {
					more.value = false;
					moreFetching.value = false;
				});
			} else {
				items.value = items.value.concat(res);
				more.value = false;
				moreFetching.value = false;
			}
		} else {
			if (props.pagination.prepend) {
				reverseConcat(res).then(() => {
					more.value = true;
					moreFetching.value = false;
				});
			} else {
				items.value = items.value.concat(res);
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
	if (!more.value || fetching.value || moreFetching.value || items.value.length === 0) return;
	moreFetching.value = true;
	const params = props.pagination.params ? isRef(props.pagination.params) ? props.pagination.params.value : props.pagination.params : {};
	await misskeyApi<MisskeyEntity[]>(props.pagination.endpoint, {
		...params,
		limit: SECOND_FETCH_LIMIT,
		...(props.pagination.offsetMode ? {
			offset: offset.value,
		} : {
			sinceId: items.value[0].id,
		}),
	}).then(res => {
		res = res.filter(item => !props.filter || props.filter(item));

		if (res.length === 0) {
			items.value = res.concat(items.value);
			more.value = false;
		} else {
			items.value = res.concat(items.value);
			more.value = true;
		}
		offset.value += res.length;
		moreFetching.value = false;
	}, err => {
		moreFetching.value = false;
	});
};

const isTop = (): boolean => isBackTop.value || (props.pagination.prepend ? isBottomVisible : isTopVisible)(contentEl.value!, TOLERANCE);

watch(visibility, () => {
	if (visibility.value === 'hidden') {
		timerForSetPause = window.setTimeout(() => {
			isPausingUpdate = true;
			timerForSetPause = null;
		},
		BACKGROUND_PAUSE_WAIT_SEC * 1000);
	} else { // 'visible'
		if (timerForSetPause) {
			clearTimeout(timerForSetPause);
			timerForSetPause = null;
		} else {
			isPausingUpdate = false;
			if (isTop()) {
				executeQueue();
			}
		}
	}
});

const prepend = (item: MisskeyEntity): void => {
	// 初回表示時はunshiftだけでOK
	if (!rootEl.value) {
		items.value.unshift(item);
		return;
	}

	if (isTop() && !isPausingUpdate) unshiftItems([item]);
	else prependQueue(item);
};

function unshiftItems(newItems: MisskeyEntity[]) {
	const length = newItems.length + items.value.length;
	items.value = [...newItems, ...items.value].slice(0, props.displayLimit);

	if (length >= props.displayLimit) more.value = true;
}

function executeQueue() {
	if (queue.value.length === 0) return;
	unshiftItems(queue.value);
	queue.value = [];
}

function prependQueue(newItem: MisskeyEntity) {
	queue.value.unshift(newItem);
	if (queue.value.length >= props.displayLimit) {
		queue.value.pop();
	}
}

const appendItem = (item: MisskeyEntity): void => {
	items.value.push(item);
};

const removeItem = (finder: (item: MisskeyEntity) => boolean) => {
	const i = items.value.findIndex(finder);
	items.value.splice(i, 1);
};

const updateItem = (id: MisskeyEntity['id'], replacer: (old: MisskeyEntity) => MisskeyEntity): void => {
	const i = items.value.findIndex(item => item.id === id);
	items.value[i] = replacer(items.value[i]);
};

onActivated(() => {
	isBackTop.value = false;
});

onDeactivated(() => {
	isBackTop.value = props.pagination.prepend ? window.scrollY >= (rootEl.value ? rootEl.value.scrollHeight - window.innerHeight : 0) : window.scrollY === 0;
});

function toBottom() {
	scrollToBottom(contentEl.value!);
}

onBeforeMount(() => {
	init().then(() => {
		if (props.pagination.prepend) {
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
	if (timerForSetPause) {
		clearTimeout(timerForSetPause);
		timerForSetPause = null;
	}
	scrollObserver.value?.disconnect();
});

defineExpose({
	items,
	queue,
	backed: backed.value,
	more,
	reload,
	prepend,
	deleteItem,
	append: appendItem,
	removeItem,
	updateItem,
	stopFetch: () => {
		more.value = false;
	},
	startFetch: () => {
		more.value = true;
	},
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
