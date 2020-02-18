<template>
<div class="mk-notifications" :class="{ page }">
	<x-list class="notifications" :items="items" v-slot="{ item: notification }">
		<x-notification :notification="notification" :with-time="true" :full="true" class="notification" :class="{ _panel: page }" :key="notification.id"/>
	</x-list>

	<button class="more _button" v-if="more" @click="fetchMore" :disabled="moreFetching">
		<template v-if="!moreFetching">{{ $t('loadMore') }}</template>
		<template v-if="moreFetching"><fa :icon="faSpinner" pulse fixed-width/></template>
	</button>

	<p class="empty" v-if="empty">{{ $t('noNotifications') }}</p>

	<mk-error v-if="error" @retry="init()"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import i18n from '../i18n';
import paging from '../scripts/paging';
import XNotification from './notification.vue';
import XList from './date-separated-list.vue';

export default Vue.extend({
	i18n,

	components: {
		XNotification,
		XList,
	},

	mixins: [
		paging({}),
	],

	props: {
		type: {
			type: String,
			required: false
		},
		page: {
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
	&.page {
		> .notifications {
			> ::v-deep * {
				margin-bottom: var(--margin);
			}
		}
	}

	&:not(.page) {
		> .notifications {
			> ::v-deep * {
				margin-bottom: 8px;
			}

			> .notification {
				background: var(--panel);
				border-radius: 6px;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
			}
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
</style>
