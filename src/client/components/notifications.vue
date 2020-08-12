<template>
<div class="mfcuwfyp">
	<x-list class="notifications" :items="items" v-slot="{ item: notification }">
		<x-note v-if="['reply', 'quote', 'mention'].includes(notification.type)" :note="notification.note" @updated="noteUpdated(notification.note, $event)" :key="notification.id"/>
		<x-notification v-else :notification="notification" :with-time="true" :full="true" class="_panel notification" :key="notification.id"/>
	</x-list>

	<button class="_panel _button" ref="loadMore" v-show="more" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }">
		<template v-if="!moreFetching">{{ $t('loadMore') }}</template>
		<template v-if="moreFetching"><mk-loading inline/></template>
	</button>

	<p class="empty" v-if="empty">{{ $t('noNotifications') }}</p>

	<mk-error v-if="error" @retry="init()"/>
</div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import paging from '../scripts/paging';
import XNotification from './notification.vue';
import XList from './date-separated-list.vue';
import XNote from './note.vue';
import { notificationTypes } from '../../types';

export default Vue.extend({
	components: {
		XNotification,
		XList,
		XNote,
	},

	mixins: [
		paging({}),
	],

	props: {
		includeTypes: {
			type: Array as PropType<typeof notificationTypes[number][]>,
			required: false,
			default: null,
		},
	},

	data() {
		return {
			connection: null,
			pagination: {
				endpoint: 'i/notifications',
				limit: 10,
				params: () => ({
					includeTypes: this.includeTypes || this.$store.state.i.includingNotificationTypes || undefined,
				})
			},
		};
	},

	watch: {
		includeTypes() {
			this.reload();
		},
		'$store.state.i.includingNotificationTypes'() {
			if (this.includeTypes === null) {
				this.reload();
			}
		}
	},

	mounted() {
		this.connection = this.$root.stream.useSharedConnection('main');
		this.connection.on('notification', this.onNotification);
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		onNotification(notification) {
			const isMuted = this.includeTypes !== null && !this.includeTypes.includes(notification.type);
			if (isMuted || document.visibilityState === 'visible') {
				this.$root.stream.send('readNotification', {
					id: notification.id
				});
			}

			if (!isMuted) {
				this.prepend({
					...notification,
					isRead: document.visibilityState === 'visible'
				});
			}
		},

		noteUpdated(oldValue, newValue) {
			const i = this.items.findIndex(n => n.note === oldValue);
			Vue.set(this.items, i, {
				...this.items[i],
				note: newValue
			});
		},
	}
});
</script>

<style lang="scss" scoped>
.mfcuwfyp {
	> .empty {
		margin: 0;
		padding: 16px;
		text-align: center;
		color: var(--fg);
	}

	> .placeholder {
		padding: 32px;
		opacity: 0.3;
	}
}
</style>
