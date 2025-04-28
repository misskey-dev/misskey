<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition
	:enterActiveClass="prefer.s.animation ? $style.transition_fade_enterActive : ''"
	:leaveActiveClass="prefer.s.animation ? $style.transition_fade_leaveActive : ''"
	:enterFromClass="prefer.s.animation ? $style.transition_fade_enterFrom : ''"
	:leaveToClass="prefer.s.animation ? $style.transition_fade_leaveTo : ''"
	mode="out-in"
>
	<MkLoading v-if="paginator.fetching.value"/>

	<MkError v-else-if="paginator.error.value" @retry="paginator.init()"/>

	<div v-else-if="paginator.items.value.size === 0" key="_empty_">
		<slot name="empty">
			<div class="_fullinfo">
				<img :src="infoImageUrl" draggable="false"/>
				<div>{{ i18n.ts.nothing }}</div>
			</div>
		</slot>
	</div>

	<div v-else ref="rootEl" class="_gaps">
		<div v-show="pagination.reversed && paginator.canFetchMore.value" key="_more_">
			<MkButton v-if="!paginator.moreFetching.value" v-appear="(prefer.s.enableInfiniteScroll && !props.disableAutoLoad) ? appearFetchMoreAhead : null" :class="$style.more" :wait="paginator.moreFetching.value" primary rounded @click="paginator.fetchMoreAhead">
				{{ i18n.ts.loadMore }}
			</MkButton>
			<MkLoading v-else/>
		</div>
		<slot :items="Array.from(paginator.items.value.values())" :fetching="paginator.fetching.value || paginator.moreFetching.value"></slot>
		<div v-show="!pagination.reversed && paginator.canFetchMore.value" key="_more_">
			<MkButton v-if="!paginator.moreFetching.value" v-appear="(prefer.s.enableInfiniteScroll && !props.disableAutoLoad) ? appearFetchMore : null" :class="$style.more" :wait="paginator.moreFetching.value" primary rounded @click="paginator.fetchMore">
				{{ i18n.ts.loadMore }}
			</MkButton>
			<MkLoading v-else/>
		</div>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import type { PagingCtx } from '@/use/use-pagination.js';
import { infoImageUrl } from '@/instance.js';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import { usePagination } from '@/use/use-pagination.js';

const props = withDefaults(defineProps<{
	pagination: PagingCtx;
	disableAutoLoad?: boolean;
	displayLimit?: number;
}>(), {
	displayLimit: 20,
});

const paginator = usePagination({
	ctx: props.pagination,
});

function appearFetchMoreAhead() {
	paginator.fetchMoreAhead();
}

function appearFetchMore() {
	paginator.fetchMore();
}

onMounted(() => {
	paginator.init();
});

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
