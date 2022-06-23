<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="800">
		<div class="clupoqwt">
			<XNotifications class="notifications" :include-types="includeTypes" :unread-only="tab === 'unread'"/>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { notificationTypes } from 'misskey-js';
import XNotifications from '@/components/notifications.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let tab = $ref('all');
let includeTypes = $ref<string[] | null>(null);

function setFilter(ev) {
	const typeItems = notificationTypes.map(t => ({
		text: i18n.t(`_notification._types.${t}`),
		active: includeTypes && includeTypes.includes(t),
		action: () => {
			includeTypes = [t];
		},
	}));
	const items = includeTypes != null ? [{
		icon: 'fas fa-times',
		text: i18n.ts.clear,
		action: () => {
			includeTypes = null;
		},
	}, null, ...typeItems] : typeItems;
	os.popupMenu(items, ev.currentTarget ?? ev.target);
}

const headerActions = $computed(() => [{
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
}]);

const headerTabs = $computed(() => [{
	key: 'all',
	title: i18n.ts.all,
}, {
	key: 'unread',
	title: i18n.ts.unread,
}]);

definePageMetadata(computed(() => ({
	title: i18n.ts.notifications,
	icon: 'fas fa-bell',
	bg: 'var(--bg)',
})));
</script>

<style lang="scss" scoped>
.clupoqwt {
}
</style>
