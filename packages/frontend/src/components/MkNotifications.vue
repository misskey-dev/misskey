<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPullToRefresh :refresher="() => reload()">
	<MkPagination ref="pagingComponent" :pagination="pagination">
		<template #empty>
			<div class="_fullinfo">
				<img :src="infoImageUrl" class="_ghost"/>
				<div>{{ i18n.ts.noNotifications }}</div>
			</div>
		</template>

		<template #default="{ items: notifications }">
			<MkDateSeparatedList v-slot="{ item: notification }" :class="$style.list" :items="notifications" :noGap="true">
				<MkNote v-if="['reply', 'quote', 'mention'].includes(notification.type)" :key="notification.id + ':note'" :note="notification.note" :withHardMute="true"/>
				<XNotification v-else :key="notification.id" :notification="notification" :withTime="true" :full="true" class="_panel"/>
			</MkDateSeparatedList>
		</template>
	</MkPagination>
</MkPullToRefresh>
</template>

<script lang="ts" setup>
import { onUnmounted, onDeactivated, onMounted, computed, shallowRef, onActivated } from 'vue';
import * as Misskey from 'misskey-js';
import MkPagination from '@/components/MkPagination.vue';
import XNotification from '@/components/MkNotification.vue';
import MkDateSeparatedList from '@/components/MkDateSeparatedList.vue';
import MkNote from '@/components/MkNote.vue';
import { useStream } from '@/stream.js';
import { i18n } from '@/i18n.js';
import { notificationTypes } from '@/const.js';
import { infoImageUrl } from '@/instance.js';
import { defaultStore } from '@/store.js';
import MkPullToRefresh from '@/components/MkPullToRefresh.vue';

const props = defineProps<{
	excludeTypes?: typeof notificationTypes[number][];
}>();

const pagingComponent = shallowRef<InstanceType<typeof MkPagination>>();

const pagination = computed(() => defaultStore.reactiveState.useGroupedNotifications.value ? {
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
});

function onNotification(notification: Misskey.entities.Notification) {
	const isMuted = props.excludeTypes ? props.excludeTypes.includes(notification.type) : false;
	const isAlreadyShown = pagingComponent.value?.items.has(notification.id);
	if (isMuted || document.visibilityState === 'visible') {
		useStream().send('readNotification');
	}

	if (!isMuted && !isAlreadyShown) {
		pagingComponent.value?.prepend(notification);
	}
}

function reload() {
	return new Promise<void>((res) => {
		pagingComponent.value?.reload().then(() => {
			res();
		});
	});
}

let connection: Misskey.ChannelConnection<Misskey.Channels['main']> | undefined;

onMounted(() => {
	if (!connection) {
		connection = useStream().useChannel('main');
		if (connection) {
			connection.on('notification', onNotification);
			connection.on('notificationFlushed', reload);
		}
	}
});

onActivated(() => {
	if (!connection) {
		connection = useStream().useChannel('main');
		if (connection) {
			connection.on('notification', onNotification);
			connection.on('notificationFlushed', reload);
		}
	}
	pagingComponent.value?.reload();
});

onUnmounted(() => {
	if (connection) {
		connection.dispose();
		connection = undefined;
	}
});

onDeactivated(() => {
	if (connection) {
		connection.dispose();
		connection = undefined;
	}
});

defineExpose({
	reload,
});
</script>

<style lang="scss" module>
.list {
	background: var(--panel);
}
</style>
