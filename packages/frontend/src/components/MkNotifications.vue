<template>
<MkPagination ref="pagingComponent" :pagination="pagination">
	<template #empty>
		<div class="_fullinfo">
			<img src="https://xn--931a.moe/assets/info.jpg" class="_ghost"/>
			<div>{{ i18n.ts.noNotifications }}</div>
		</div>
	</template>

	<template #default="{ items: notifications }">
		<MkDateSeparatedList v-slot="{ item: notification }" :class="$style.list" :items="notifications" :no-gap="true">
			<MkNote v-if="['reply', 'quote', 'mention'].includes(notification.type)" :key="notification.id" :note="notification.note"/>
			<XNotification v-else :key="notification.id" :notification="notification" :with-time="true" :full="true" class="_panel notification"/>
		</MkDateSeparatedList>
	</template>
</MkPagination>
</template>

<script lang="ts" setup>
import { onUnmounted, onMounted, computed, shallowRef } from 'vue';
import MkPagination, { Paging } from '@/components/MkPagination.vue';
import XNotification from '@/components/MkNotification.vue';
import MkDateSeparatedList from '@/components/MkDateSeparatedList.vue';
import MkNote from '@/components/MkNote.vue';
import { stream } from '@/stream';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import { notificationTypes } from '@/const';

const props = defineProps<{
	includeTypes?: typeof notificationTypes[number][];
	unreadOnly?: boolean;
}>();

const pagingComponent = shallowRef<InstanceType<typeof MkPagination>>();

const pagination: Paging = {
	endpoint: 'i/notifications' as const,
	limit: 10,
	params: computed(() => ({
		includeTypes: props.includeTypes ?? undefined,
		excludeTypes: props.includeTypes ? undefined : $i.mutingNotificationTypes,
		unreadOnly: props.unreadOnly,
	})),
};

const onNotification = (notification) => {
	const isMuted = props.includeTypes ? !props.includeTypes.includes(notification.type) : $i.mutingNotificationTypes.includes(notification.type);
	if (isMuted || document.visibilityState === 'visible') {
		stream.send('readNotification', {
			id: notification.id,
		});
	}

	if (!isMuted) {
		pagingComponent.value.prepend({
			...notification,
			isRead: document.visibilityState === 'visible',
		});
	}
};

let connection;

onMounted(() => {
	connection = stream.useChannel('main');
	connection.on('notification', onNotification);
	connection.on('readAllNotifications', () => {
		if (pagingComponent.value) {
			for (const item of pagingComponent.value.queue) {
				item.isRead = true;
			}
			for (const item of pagingComponent.value.items) {
				item.isRead = true;
			}
		}
	});
	connection.on('readNotifications', notificationIds => {
		if (pagingComponent.value) {
			for (let i = 0; i < pagingComponent.value.queue.length; i++) {
				if (notificationIds.includes(pagingComponent.value.queue[i].id)) {
					pagingComponent.value.queue[i].isRead = true;
				}
			}
			for (let i = 0; i < (pagingComponent.value.items || []).length; i++) {
				if (notificationIds.includes(pagingComponent.value.items[i].id)) {
					pagingComponent.value.items[i].isRead = true;
				}
			}
		}
	});
});

onUnmounted(() => {
	if (connection) connection.dispose();
});
</script>

<style lang="scss" module>
.list {
	background: var(--panel);
}
</style>
