<template>
<div class="mk-notifications">
	<div class="contents">
		<sequential-entrance class="notifications">
			<template v-for="(notification, i) in _notifications">
				<x-notification :notification="notification" :key="notification.id" :with-time="true" class="notification" :data-index="i"/>
				<x-date-separator class="date" :key="notification.id + '_date'" :data-index="i" v-if="i != items.length - 1 && notification._date != _notifications[i + 1]._date" :newer="notification.createdAt" :older="_notifications[i + 1].createdAt"/>
			</template>
		</sequential-entrance>

		<button class="more _button" v-if="more" @click="fetchMore" :disabled="moreFetching">
			<template v-if="!moreFetching">{{ $t('loadMore') }}</template>
			<template v-if="moreFetching"><fa :icon="faSpinner" pulse fixed-width/></template>
		</button>

		<p class="empty" v-if="empty">{{ $t('noNotifications') }}</p>

		<mk-error v-if="error" @retry="init()"/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import i18n from '../i18n';
import paging from '../scripts/paging';
import XNotification from './notification.vue';
import XDateSeparator from './date-separator.vue';

export default Vue.extend({
	i18n,

	components: {
		XNotification,
		XDateSeparator,
	},

	mixins: [
		paging({}),
	],

	props: {
		type: {
			type: String,
			required: false
		},
		wide: {
			type: Boolean,
			required: false,
			default: false
		}
	},

	data() {
		return {
			connection: null,
			pagination: {
				endpoint: 'i/notifications',
				limit: 10,
				params: () => ({
					includeTypes: this.type ? [this.type] : undefined
				})
			},
			faSpinner
		};
	},

	computed: {
		_notifications(): any[] {
			return (this.items as any).map(notification => {
				const date = new Date(notification.createdAt).getDate();
				notification._date = date;
				return notification;
			});
		}
	},

	watch: {
		type() {
			this.reload();
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
			// TODO: ユーザーが画面を見てないと思われるとき(ブラウザやタブがアクティブじゃないなど)は送信しない
			this.$root.stream.send('readNotification', {
				id: notification.id
			});

			this.prepend(notification);
		},
	}
});
</script>

<style lang="scss" scoped>
.mk-notifications {
	> .contents {
		overflow: auto;
		height: 100%;

		> .notifications {
			> .notification {
				margin: 8px;
				background: var(--bg);
				border-radius: 6px;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
			}
		}

		> .more {
			display: block;
			width: 100%;
			padding: 16px;

			> [data-icon] {
				margin-right: 4px;
			}
		}

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
}
</style>
