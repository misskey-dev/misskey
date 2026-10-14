<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component :is="prefer.s.enablePullToRefresh && pullToRefresh ? MkPullToRefresh : 'div'" :refresher="() => paginator.reload()" @contextmenu.prevent.stop="onContextmenu">
	<div>
		<MkPaginationControl v-if="props.withControl" :paginator="paginator" style="margin-bottom: 10px"/>

		<!-- :css="prefer.s.animation" にしたいけどバグる(おそらくvueのバグ) https://github.com/misskey-dev/misskey/issues/16078 -->
		<Transition
			:enterActiveClass="prefer.s.animation ? $style.transition_fade_enterActive : ''"
			:leaveActiveClass="prefer.s.animation ? $style.transition_fade_leaveActive : ''"
			:enterFromClass="prefer.s.animation ? $style.transition_fade_enterFrom : ''"
			:leaveToClass="prefer.s.animation ? $style.transition_fade_leaveTo : ''"
			:mode="prefer.s.animation ? 'out-in' : undefined"
		>
			<MkLoading v-if="paginator.fetching.value"/>

			<MkError v-else-if="paginator.error.value" @retry="paginator.init()"/>

			<div v-else-if="paginator.items.value.length === 0" key="_empty_">
				<slot name="empty"><MkResult type="empty"/></slot>
			</div>

			<div v-else key="_root_" class="_gaps">
				<div v-if="direction === 'up' || direction === 'both'" v-show="upButtonVisible">
					<MkButton v-if="!upButtonLoading" v-appear="shouldEnableInfiniteScroll ? upButtonClick : null" :class="$style.more" primary rounded @click="upButtonClick">
						{{ i18n.ts.loadMore }}
					</MkButton>
					<MkLoading v-else/>
				</div>
				<slot :items="getValue(paginator.items)" :fetching="paginator.fetching.value || paginator.fetchingOlder.value"></slot>
				<div v-if="direction === 'down' || direction === 'both'" v-show="downButtonVisible">
					<MkButton v-if="!downButtonLoading" v-appear="shouldEnableInfiniteScroll ? downButtonClick : null" :class="$style.more" primary rounded @click="downButtonClick">
						{{ i18n.ts.loadMore }}
					</MkButton>
					<MkLoading v-else/>
				</div>
			</div>
		</Transition>
	</div>
</component>
</template>

<script lang="ts">
export type MkPaginationOptions = {
	autoLoad?: boolean;
	/**
	 * ページネーションを進める方向
	 * - up: 上方向
	 * - down: 下方向 (default)
	 * - both: 双方向
	 *
	 * NOTE: この方向はページネーションの方向であって、アイテムの並び順ではない
	 */
	direction?: 'up' | 'down' | 'both';
	pullToRefresh?: boolean;
	withControl?: boolean;
	forceDisableInfiniteScroll?: boolean;
};
</script>

<script lang="ts" setup generic="T extends IPaginator">
import { isLink } from '@@/js/is-link.js';
import { onMounted, computed, watch, unref } from 'vue';
import type { UnwrapRef } from 'vue';
import type { IPaginator } from '@/utility/paginator.js';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import MkPullToRefresh from '@/components/MkPullToRefresh.vue';
import MkPaginationControl from '@/components/MkPaginationControl.vue';
import * as os from '@/os.js';

const props = withDefaults(defineProps<MkPaginationOptions & {
	paginator: T;
}>(), {
	autoLoad: true,
	direction: 'down',
	pullToRefresh: true,
	withControl: false,
	forceDisableInfiniteScroll: false,
});

const shouldEnableInfiniteScroll = computed(() => {
	return prefer.r.enableInfiniteScroll.value && !props.forceDisableInfiniteScroll;
});

function onContextmenu(ev: PointerEvent) {
	if (ev.target && isLink(ev.target as HTMLElement)) return;
	if (window.getSelection()?.toString() !== '') return;

	// TODO: 並び順設定
	os.contextMenu([{
		icon: 'ti ti-refresh',
		text: i18n.ts.reload,
		action: () => {
			props.paginator.reload();
		},
	}], ev);
}

function getValue(v: IPaginator['items']) {
	return unref(v) as UnwrapRef<T['items']>;
}

if (props.autoLoad) {
	onMounted(() => {
		props.paginator.init();
	});
}

if (props.paginator.computedParams) {
	watch(props.paginator.computedParams, () => {
		props.paginator.reload();
	}, { immediate: false, deep: true });
}

const upButtonVisible = computed(() => {
	return props.paginator.order.value === 'oldest' ? props.paginator.canFetchOlder.value : props.paginator.canFetchNewer.value;
});
const upButtonLoading = computed(() => {
	return props.paginator.order.value === 'oldest' ? props.paginator.fetchingOlder.value : props.paginator.fetchingNewer.value;
});

function upButtonClick() {
	if (props.paginator.order.value === 'oldest') {
		props.paginator.fetchOlder();
	} else {
		props.paginator.fetchNewer();
	}
}

const downButtonVisible = computed(() => {
	return props.paginator.order.value === 'oldest' ? props.paginator.canFetchNewer.value : props.paginator.canFetchOlder.value;
});
const downButtonLoading = computed(() => {
	return props.paginator.order.value === 'oldest' ? props.paginator.fetchingNewer.value : props.paginator.fetchingOlder.value;
});

function downButtonClick() {
	if (props.paginator.order.value === 'oldest') {
		props.paginator.fetchNewer();
	} else {
		props.paginator.fetchOlder();
	}
}

defineSlots<{
	empty: () => void;
	default: (props: { items: UnwrapRef<T['items']>, fetching: boolean }) => void;
}>();
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
