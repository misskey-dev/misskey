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
		<div v-show="pagination.reversed && more" key="_more_" class="cxiknjgy _gap">
			<MkButton v-if="!moreFetching" class="button" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }" primary @click="fetchMoreAhead">
				{{ $ts.loadMore }}
			</MkButton>
			<MkLoading v-else class="loading"/>
		</div>
		<slot :items="items"></slot>
		<div v-show="!pagination.reversed && more" key="_more_" class="cxiknjgy _gap">
			<MkButton v-if="!moreFetching" v-appear="($store.state.enableInfiniteScroll && !disableAutoLoad) ? fetchMore : null" class="button" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }" primary @click="fetchMore">
				{{ $ts.loadMore }}
			</MkButton>
			<MkLoading v-else class="loading"/>
		</div>
	</div>
</transition>
</template>

<script lang="ts" setup>
import { computed, ComputedRef, isRef, markRaw, onActivated, onDeactivated, Ref, ref, watch } from 'vue';
import * as misskey from 'misskey-js';
import * as os from '@/os';
import { onScrollTop, isTopVisible, getScrollPosition, getScrollContainer } from '@/scripts/scroll';
import MkButton from '@/components/ui/button.vue';

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
};

const props = withDefaults(defineProps<{
	pagination: Paging;
	disableAutoLoad?: boolean;
	displayLimit?: number;
}>(), {
	displayLimit: 30,
});

const emit = defineEmits<{
	(ev: 'queue', count: number): void;
}>();

type Item = { id: string; [another: string]: unknown; };

const rootEl = ref<HTMLElement>();
const items = ref<Item[]>([]);
const queue = ref<Item[]>([]);
const offset = ref(0);
const fetching = ref(true);
const moreFetching = ref(false);
const more = ref(false);
const backed = ref(false); // 遡り中か否か
const isBackTop = ref(false);
const empty = computed(() => items.value.length === 0);
const error = ref(false);

const init = async (): Promise<void> => {
	queue.value = [];
	fetching.value = true;
	const params = props.pagination.params ? isRef(props.pagination.params) ? props.pagination.params.value : props.pagination.params : {};
	await os.api(props.pagination.endpoint, {
		...params,
		limit: props.pagination.noPaging ? (props.pagination.limit || 10) : (props.pagination.limit || 10) + 1,
	}).then(res => {
		for (let i = 0; i < res.length; i++) {
			const item = res[i];
			if (props.pagination.reversed) {
				if (i === res.length - 2) item._shouldInsertAd_ = true;
			} else {
				if (i === 3) item._shouldInsertAd_ = true;
			}
		}
		if (!props.pagination.noPaging && (res.length > (props.pagination.limit || 10))) {
			res.pop();
			items.value = props.pagination.reversed ? [...res].reverse() : res;
			more.value = true;
		} else {
			items.value = props.pagination.reversed ? [...res].reverse() : res;
			more.value = false;
		}
		offset.value = res.length;
		error.value = false;
		fetching.value = false;
	}, err => {
		error.value = true;
		fetching.value = false;
	});
};

const reload = (): void => {
	items.value = [];
	init();
};

const fetchMore = async (): Promise<void> => {
	if (!more.value || fetching.value || moreFetching.value || items.value.length === 0) return;
	moreFetching.value = true;
	backed.value = true;
	const params = props.pagination.params ? isRef(props.pagination.params) ? props.pagination.params.value : props.pagination.params : {};
	await os.api(props.pagination.endpoint, {
		...params,
		limit: SECOND_FETCH_LIMIT + 1,
		...(props.pagination.offsetMode ? {
			offset: offset.value,
		} : {
			untilId: props.pagination.reversed ? items.value[0].id : items.value[items.value.length - 1].id,
		}),
	}).then(res => {
		for (let i = 0; i < res.length; i++) {
			const item = res[i];
			if (props.pagination.reversed) {
				if (i === res.length - 9) item._shouldInsertAd_ = true;
			} else {
				if (i === 10) item._shouldInsertAd_ = true;
			}
		}
		if (res.length > SECOND_FETCH_LIMIT) {
			res.pop();
			items.value = props.pagination.reversed ? [...res].reverse().concat(items.value) : items.value.concat(res);
			more.value = true;
		} else {
			items.value = props.pagination.reversed ? [...res].reverse().concat(items.value) : items.value.concat(res);
			more.value = false;
		}
		offset.value += res.length;
		moreFetching.value = false;
	}, err => {
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
			sinceId: props.pagination.reversed ? items.value[0].id : items.value[items.value.length - 1].id,
		}),
	}).then(res => {
		if (res.length > SECOND_FETCH_LIMIT) {
			res.pop();
			items.value = props.pagination.reversed ? [...res].reverse().concat(items.value) : items.value.concat(res);
			more.value = true;
		} else {
			items.value = props.pagination.reversed ? [...res].reverse().concat(items.value) : items.value.concat(res);
			more.value = false;
		}
		offset.value += res.length;
		moreFetching.value = false;
	}, err => {
		moreFetching.value = false;
	});
};

const prepend = (item: Item): void => {
	if (props.pagination.reversed) {
		if (rootEl.value) {
			const container = getScrollContainer(rootEl.value);
			if (container == null) return; // TODO?

			const pos = getScrollPosition(rootEl.value);
			const viewHeight = container.clientHeight;
			const height = container.scrollHeight;
			const isBottom = (pos + viewHeight > height - 32);
			if (isBottom) {
				// オーバーフローしたら古いアイテムは捨てる
				if (items.value.length >= props.displayLimit) {
					// このやり方だとVue 3.2以降アニメーションが動かなくなる
					//items.value = items.value.slice(-props.displayLimit);
					while (items.value.length >= props.displayLimit) {
						items.value.shift();
					}
					more.value = true;
				}
			}
		}
		items.value.push(item);
		// TODO
	} else {
		// 初回表示時はunshiftだけでOK
		if (!rootEl.value) {
			items.value.unshift(item);
			return;
		}

		const isTop = isBackTop.value || (document.body.contains(rootEl.value) && isTopVisible(rootEl.value));

		if (isTop) {
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
			onScrollTop(rootEl.value, () => {
				for (const item of queue.value) {
					prepend(item);
				}
				queue.value = [];
			});
		}
	}
};

const append = (item: Item): void => {
	items.value.push(item);
};

const removeItem = (finder: (item: Item) => boolean) => {
	const i = items.value.findIndex(finder);
	items.value.splice(i, 1);
};

const updateItem = (id: Item['id'], replacer: (old: Item) => Item): void => {
	const i = items.value.findIndex(item => item.id === id);
	items.value[i] = replacer(items.value[i]);
};

if (props.pagination.params && isRef(props.pagination.params)) {
	watch(props.pagination.params, init, { deep: true });
}

watch(queue, (a, b) => {
	if (a.length === 0 && b.length === 0) return;
	emit('queue', queue.value.length);
}, { deep: true });

init();

onActivated(() => {
	isBackTop.value = false;
});

onDeactivated(() => {
	isBackTop.value = window.scrollY === 0;
});

defineExpose({
	items,
	queue,
	backed,
	reload,
	prepend,
	append,
	removeItem,
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
