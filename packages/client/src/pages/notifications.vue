<template>
<MkSpacer :content-max="800">
	<div class="clupoqwt">
		<XNotifications class="notifications" :include-types="includeTypes" :unread-only="tab === 'unread'" @before="before" @after="after"/>
	</div>
</MkSpacer>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import Progress from '@/scripts/loading';
import XNotifications from '@/components/notifications.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { notificationTypes } from 'misskey-js';

export default defineComponent({
	components: {
		XNotifications
	},

	data() {
		return {
			[symbols.PAGE_INFO]: computed(() => ({
				title: this.$ts.notifications,
				icon: 'fas fa-bell',
				bg: 'var(--bg)',
				actions: [{
					text: this.$ts.filter,
					icon: 'fas fa-filter',
					highlighted: this.includeTypes != null,
					handler: this.setFilter,
				}, {
					text: this.$ts.markAllAsRead,
					icon: 'fas fa-check',
					handler: () => {
						os.apiWithDialog('notifications/mark-all-as-read');
					},
				}],
				tabs: [{
					active: this.tab === 'all',
					title: this.$ts.all,
					onClick: () => { this.tab = 'all'; },
				}, {
					active: this.tab === 'unread',
					title: this.$ts.unread,
					onClick: () => { this.tab = 'unread'; },
				},]
			})),
			tab: 'all',
			includeTypes: null,
		};
	},

	methods: {
		before() {
			Progress.start();
		},

		after() {
			Progress.done();
		},

		setFilter(ev) {
			const typeItems = notificationTypes.map(t => ({
				text: this.$t(`_notification._types.${t}`),
				active: this.includeTypes && this.includeTypes.includes(t),
				action: () => {
					this.includeTypes = [t];
				}
			}));
			const items = this.includeTypes != null ? [{
				icon: 'fas fa-times',
				text: this.$ts.clear,
				action: () => {
					this.includeTypes = null;
				}
			}, null, ...typeItems] : typeItems;
			os.popupMenu(items, ev.currentTarget || ev.target);
		}
	}
});
</script>

<style lang="scss" scoped>
.clupoqwt {
}
</style>
