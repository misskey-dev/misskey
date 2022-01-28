<template>
<MkSpacer :content-max="800">
	<div class="clupoqwt">
		<XNotifications class="notifications" :include-types="includeTypes" :unread-only="tab === 'unread'"/>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import XNotifications from '@/components/notifications.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { notificationTypes } from 'misskey-js';
import { i18n } from '@/i18n';

let tab = $ref('all');
let includeTypes = $ref<string[] | null>(null);

function setFilter(ev) {
	const typeItems = notificationTypes.map(t => ({
		text: i18n.t(`_notification._types.${t}`),
		active: includeTypes && includeTypes.includes(t),
		action: () => {
			includeTypes = [t];
		}
	}));
	const items = includeTypes != null ? [{
		icon: 'fas fa-times',
		text: i18n.ts.clear,
		action: () => {
			includeTypes = null;
		}
	}, null, ...typeItems] : typeItems;
	os.popupMenu(items, ev.currentTarget ?? ev.target);
}

defineExpose({
	[symbols.PAGE_INFO]: computed(() => ({
		title: i18n.ts.notifications,
		icon: 'fas fa-bell',
		bg: 'var(--bg)',
		actions: [{
			text: i18n.ts.filter,
			icon: 'fas fa-filter',
			highlighted: includeTypes != null,
			handler: setFilter,
		}, {
			text: i18n.ts.markAllAsRead,
			icon: 'fas fa-check',
			handler: () => {
				os.apiWithDialog('notifications/mark-all-as-read');
			},
		}],
		tabs: [{
			active: tab === 'all',
			title: i18n.ts.all,
			onClick: () => { tab = 'all'; },
		}, {
			active: tab === 'unread',
			title: i18n.ts.unread,
			onClick: () => { tab = 'unread'; },
		},]
	})),
});
</script>

<style lang="scss" scoped>
.clupoqwt {
}
</style>
