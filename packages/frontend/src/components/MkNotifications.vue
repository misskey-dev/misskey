<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPullToRefresh :refresher="() => reload()">
	<MkPagination ref="pagingComponent" :pagination="pagination" :filter="filterMutedNotification">
		<template #empty>
			<div class="_fullinfo">
				<img :src="infoImageUrl" class="_ghost"/>
				<div>{{ i18n.ts.noNotifications }}</div>
			</div>
		</template>

		<template #default="{ items: notifications }">
			<MkDateSeparatedList v-slot="{ item: notification }" :class="$style.list" :items="notifications" :noGap="true">
				<MkNote v-if="['reply', 'quote', 'mention'].includes(notification.type)" :key="notification.id + ':note'" :note="notification.note"/>
				<XNotification v-else :key="notification.id" :notification="notification" :withTime="true" :full="true" class="_panel"/>
			</MkDateSeparatedList>
		</template>
	</MkPagination>
</MkPullToRefresh>
</template>

<script lang="ts" setup>
import { onUnmounted, onMounted, computed, ref, shallowRef, onActivated } from 'vue';
import MkPagination from '@/components/MkPagination.vue';
import XNotification from '@/components/MkNotification.vue';
import MkDateSeparatedList from '@/components/MkDateSeparatedList.vue';
import MkNote from '@/components/MkNote.vue';
import { useStream } from '@/stream.js';
import { i18n } from '@/i18n.js';
import { notificationTypes } from '@/const.js';
import { infoImageUrl } from '@/instance.js';
import { defaultStore } from '@/store.js';
import { filterMutedNotification } from '@/scripts/filter-muted-notification.js';
import MkPullToRefresh from '@/components/MkPullToRefresh.vue';
import * as Misskey from 'misskey-js';

const props = defineProps<{
	excludeTypes?: typeof notificationTypes[number][];
}>();

const pagingComponent = shallowRef<InstanceType<typeof MkPagination>>();
const hasNewNotificationWhileTabHidden = ref(false);

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

function onNotification(notification) {
	const isMuted = props.excludeTypes ? props.excludeTypes.includes(notification.type) : false;
	if (isMuted || document.visibilityState === 'visible') {
		useStream().send('readNotification');
	}

	if (!document.hidden && !isMuted && filterMutedNotification(notification)) {
		pagingComponent.value?.prepend(notification);
	}

	if (document.hidden && !hasNewNotificationWhileTabHidden.value) {
		hasNewNotificationWhileTabHidden.value = true;
	}
}

function reload() {
	return new Promise<void>((res) => {
		pagingComponent.value?.reload().then(() => {
			res();
		});
	});
}

function onVisibilityChange() {
	if (document.visibilityState === 'visible') {
		if (hasNewNotificationWhileTabHidden.value) {
			hasNewNotificationWhileTabHidden.value = false;
			reload();
		}
	}
}

let connection: Misskey.ChannelConnection<Misskey.Channels['main']>;

onMounted(() => {
	connection = useStream().useChannel('main');
	connection.on('notification', onNotification);
	connection.on('notificationFlushed', reload);
	document.addEventListener('visibilitychange', onVisibilityChange);
});

onActivated(() => {
	pagingComponent.value?.reload();
});

onUnmounted(() => {
	if (connection) connection.dispose();
	document.removeEventListener('visibilitychange', onVisibilityChange);
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
