<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPullToRefresh :refresher="() => reload()">
	<MkLoading v-if="paginator.fetching.value"/>

	<MkError v-else-if="paginator.error.value" @retry="paginator.init()"/>

	<div v-else-if="paginator.items.value.length === 0" key="_empty_">
		<slot name="empty">
			<div class="_fullinfo">
				<img :src="infoImageUrl" draggable="false"/>
				<div>{{ i18n.ts.noNotifications }}</div>
			</div>
		</slot>
	</div>

	<div v-else ref="rootEl">
		<component
			:is="prefer.s.animation ? TransitionGroup : 'div'" :class="[$style.notifications]"
			:enterActiveClass="$style.transition_x_enterActive"
			:leaveActiveClass="$style.transition_x_leaveActive"
			:enterFromClass="$style.transition_x_enterFrom"
			:leaveToClass="$style.transition_x_leaveTo"
			:moveClass=" $style.transition_x_move"
			tag="div"
		>
			<template v-for="(notification, i) in paginator.items.value" :key="notification.id">
				<MkNote v-if="['reply', 'quote', 'mention'].includes(notification.type)" :class="$style.item" :note="notification.note" :withHardMute="true" :data-scroll-anchor="notification.id"/>
				<XNotification v-else :class="$style.item" :notification="notification" :withTime="true" :full="true" :data-scroll-anchor="notification.id"/>
			</template>
		</component>
		<button v-show="paginator.canFetchMore.value" key="_more_" v-appear="prefer.s.enableInfiniteScroll ? paginator.fetchOlder : null" :disabled="paginator.moreFetching.value" class="_button" :class="$style.more" @click="paginator.fetchOlder">
			<div v-if="!paginator.moreFetching.value">{{ i18n.ts.loadMore }}</div>
			<MkLoading v-else/>
		</button>
	</div>
</MkPullToRefresh>
</template>

<script lang="ts" setup>
import { onUnmounted, onMounted, computed, useTemplateRef, TransitionGroup } from 'vue';
import * as Misskey from 'misskey-js';
import { useInterval } from '@@/js/use-interval.js';
import type { notificationTypes } from '@@/js/const.js';
import XNotification from '@/components/MkNotification.vue';
import MkNote from '@/components/MkNote.vue';
import { useStream } from '@/stream.js';
import { i18n } from '@/i18n.js';
import { infoImageUrl } from '@/instance.js';
import MkPullToRefresh from '@/components/MkPullToRefresh.vue';
import { prefer } from '@/preferences.js';
import { store } from '@/store.js';
import { usePagination } from '@/use/use-pagination.js';

const props = defineProps<{
	excludeTypes?: typeof notificationTypes[number][];
}>();

const rootEl = useTemplateRef('rootEl');

const paginator = usePagination({
	ctx: prefer.s.useGroupedNotifications ? {
		endpoint: 'i/notifications-grouped' as const,
		limit: 20,
		params: computed(() => ({
			excludeTypes: props.excludeTypes ?? undefined,
		})),
	} : {
		endpoint: 'i/notifications' as const,
		limit: 20,
		params: computed(() => ({
			excludeTypes: props.excludeTypes ?? undefined,
		})),
	},
});

const POLLING_INTERVAL = 1000 * 15;

if (!store.s.realtimeMode) {
	useInterval(async () => {
		paginator.fetchNewer({
			toQueue: false,
		});
	}, POLLING_INTERVAL, {
		immediate: false,
		afterMounted: true,
	});
}

function onNotification(notification) {
	const isMuted = props.excludeTypes ? props.excludeTypes.includes(notification.type) : false;
	if (isMuted || window.document.visibilityState === 'visible') {
		if (store.s.realtimeMode) {
			useStream().send('readNotification');
		}
	}

	if (!isMuted) {
		paginator.prepend(notification);
	}
}

function reload() {
	return paginator.reload();
}

let connection: Misskey.ChannelConnection<Misskey.Channels['main']> | null = null;

onMounted(() => {
	if (store.s.realtimeMode) {
		connection = useStream().useChannel('main');
		connection.on('notification', onNotification);
		connection.on('notificationFlushed', reload);
	}
});

onUnmounted(() => {
	if (connection) connection.dispose();
});

defineExpose({
	reload,
});
</script>

<style lang="scss" module>
.transition_x_move,
.transition_x_enterActive,
.transition_x_leaveActive {
	transition: opacity 0.3s cubic-bezier(0,.5,.5,1), transform 0.3s cubic-bezier(0,.5,.5,1) !important;
}
.transition_x_enterFrom,
.transition_x_leaveTo {
	opacity: 0;
	transform: translateY(-50%);
}
.transition_x_leaveActive {
	position: absolute;
}

.notifications {
	container-type: inline-size;
	background: var(--MI_THEME-panel);
}

.item:not(:last-child) {
	border-bottom: solid 0.5px var(--MI_THEME-divider);
}

.more {
	display: block;
	width: 100%;
	box-sizing: border-box;
	padding: 16px;
	background: var(--MI_THEME-panel);
	border-top: solid 0.5px var(--MI_THEME-divider);
}
</style>
