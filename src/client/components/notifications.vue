<template>
<div class="mfcuwfyp">
	<x-list class="notifications" :items="items" v-slot="{ item: notification }">
		<x-note v-if="['reply', 'quote', 'mention'].includes(notification.type)" :note="notification.note" :key="notification.id"/>
		<x-notification v-else :notification="notification" :with-time="true" :full="true" class="_panel notification" :key="notification.id"/>
	</x-list>

	<button class="_panel _button" v-if="more" @click="fetchMore" :disabled="moreFetching">
		<template v-if="!moreFetching">{{ $t('loadMore') }}</template>
		<template v-if="moreFetching"><mk-loading inline/></template>
	</button>

	<p class="empty" v-if="empty">{{ $t('noNotifications') }}</p>

	<mk-error v-if="error" @retry="init()"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../i18n';
import paging from '../scripts/paging';
import XNotification from './notification.vue';
import XList from './date-separated-list.vue';
import XNote from './note.vue';

export default Vue.extend({
	i18n,

	components: {
		XNotification,
		XList,
		XNote,
	},

	mixins: [
		paging({}),
	],

	props: {
		type: {
			type: String,
			required: false
		},
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
.mfcuwfyp {
	> .notifications {
		> ::v-deep * {
			//margin-bottom: var(--margin);
			margin-bottom: 0;
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
