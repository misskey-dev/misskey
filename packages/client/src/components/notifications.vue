<template>
<MkPagination ref="pagingComponent" :pagination="pagination">
	<template #empty>
		<div class="_fullinfo">
			<img src="https://xn--931a.moe/assets/info.jpg" class="_ghost"/>
			<div>{{ $ts.noNotifications }}</div>
		</div>
	</template>

	<template #default="{ items: notifications }">
		<XList v-slot="{ item: notification }" class="elsfgstc" :items="notifications" :no-gap="true">
			<XNote v-if="['reply', 'quote', 'mention'].includes(notification.type)" :key="notification.id" :note="notification.note"/>
			<XNotification v-else :key="notification.id" :notification="notification" :with-time="true" :full="true" class="_panel notification"/>
		</XList>
	</template>
</MkPagination>
</template>

<script lang="ts" setup>
import { defineComponent, PropType, markRaw, onUnmounted, onMounted, computed, ref } from 'vue';
import { notificationTypes } from 'misskey-js';
import MkPagination from '@/components/ui/pagination.vue';
import { Paging } from '@/components/ui/pagination.vue';
import XNotification from '@/components/notification.vue';
import XList from '@/components/date-separated-list.vue';
import XNote from '@/components/note.vue';
import * as os from '@/os';
import { stream } from '@/stream';
import { $i } from '@/account';

const props = defineProps<{
	includeTypes?: PropType<typeof notificationTypes[number][]>;
	unreadOnly?: boolean;
}>();

const pagingComponent = ref<InstanceType<typeof MkPagination>>();

const allIncludeTypes = computed(() => props.includeTypes ?? notificationTypes.filter(x => !$i.mutingNotificationTypes.includes(x)));

const pagination: Paging = {
	endpoint: 'i/notifications' as const,
	limit: 10,
	params: computed(() => ({
		includeTypes: allIncludeTypes.value || undefined,
		unreadOnly: props.unreadOnly,
	})),
};

const onNotification = (notification) => {
	const isMuted = !allIncludeTypes.value.includes(notification.type);
	if (isMuted || document.visibilityState === 'visible') {
		stream.send('readNotification', {
			id: notification.id
		});
	}

	if (!isMuted) {
		pagingComponent.value.prepend({
			...notification,
			isRead: document.visibilityState === 'visible'
		});
	}
};

onMounted(() => {
	const connection = stream.useChannel('main');
	connection.on('notification', onNotification);
	onUnmounted(() => {
		connection.dispose();
	});
});
</script>

<style lang="scss" scoped>
.elsfgstc {
	background: var(--panel);
}
</style>
