<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component :is="prefer.s.enablePullToRefresh && pullToRefresh ? MkPullToRefresh : 'div'" :refresher="() => paginator.reload()">
	<!-- :css="prefer.s.animation" にしたいけどバグる(おそらくvueのバグ) https://github.com/misskey-dev/misskey/issues/16078 -->
	<Transition
		:enterActiveClass="prefer.s.animation ? $style.transition_fade_enterActive : ''"
		:leaveActiveClass="prefer.s.animation ? $style.transition_fade_leaveActive : ''"
		:enterFromClass="prefer.s.animation ? $style.transition_fade_enterFrom : ''"
		:leaveToClass="prefer.s.animation ? $style.transition_fade_leaveTo : ''"
		mode="out-in"
	>
		<MkLoading v-if="paginator.fetching.value"/>

		<MkError v-else-if="paginator.error.value" @retry="paginator.init()"/>

		<div v-else-if="paginator.items.value.length === 0" key="_empty_">
			<slot name="empty"><MkResult type="empty"/></slot>
		</div>

		<div v-else ref="rootEl" class="_gaps">
			<div v-show="pagination.reversed && paginator.canFetchOlder.value" key="_more_">
				<MkButton v-if="!paginator.fetchingOlder.value" v-appear="(prefer.s.enableInfiniteScroll && !props.disableAutoLoad) ? appearFetchMoreAhead : null" :class="$style.more" :wait="paginator.fetchingOlder.value" primary rounded @click="paginator.fetchNewer">
					{{ i18n.ts.loadMore }}
				</MkButton>
				<MkLoading v-else/>
			</div>
			<slot :items="paginator.items.value" :fetching="paginator.fetching.value || paginator.fetchingOlder.value"></slot>
			<div v-show="!pagination.reversed && paginator.canFetchOlder.value" key="_more_">
				<MkButton v-if="!paginator.fetchingOlder.value" v-appear="(prefer.s.enableInfiniteScroll && !props.disableAutoLoad) ? appearFetchMore : null" :class="$style.more" :wait="paginator.fetchingOlder.value" primary rounded @click="paginator.fetchOlder">
					{{ i18n.ts.loadMore }}
				</MkButton>
				<MkLoading v-else/>
			</div>
		</div>
	</Transition>
</component>
</template>

<script lang="ts" setup generic="T extends PagingCtx">
import type { PagingCtx } from '@/composables/use-pagination.js';
import type { UnwrapRef } from 'vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import { usePagination } from '@/composables/use-pagination.js';
import MkPullToRefresh from '@/components/MkPullToRefresh.vue';

type Paginator = ReturnType<typeof usePagination<T['endpoint']>>;

const props = withDefaults(defineProps<{
	pagination: T;
	disableAutoLoad?: boolean;
	displayLimit?: number;
	pullToRefresh?: boolean;
}>(), {
	displayLimit: 20,
	pullToRefresh: true,
});

const paginator: Paginator = usePagination({
	ctx: props.pagination,
});

function appearFetchMoreAhead() {
	paginator.fetchNewer();
}

function appearFetchMore() {
	paginator.fetchOlder();
}

defineSlots<{
	empty: () => void;
	default: (props: { items: UnwrapRef<Paginator['items']> }) => void;
}>();

defineExpose({
	paginator: paginator,
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
