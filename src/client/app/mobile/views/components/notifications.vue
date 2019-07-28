<template>
<div class="mk-notifications">
	<div class="placeholder" v-if="fetching">
		<template v-for="i in 10">
			<mk-note-skeleton :key="i"/>
		</template>
	</div>

	<!-- トランジションを有効にするとなぜかメモリリークする -->
	<component :is="!$store.state.device.reduceMotion ? 'transition-group' : 'div'" name="mk-notifications" class="transition notifications" tag="div">
		<template v-for="(notification, i) in _notifications">
			<mk-notification :notification="notification" :key="notification.id" :class="{ wide: wide }"/>
			<p class="date" :key="notification.id + '_date'" v-if="i != items.length - 1 && notification._date != _notifications[i + 1]._date">
				<span><fa icon="angle-up"/>{{ notification._datetext }}</span>
				<span><fa icon="angle-down"/>{{ _notifications[i + 1]._datetext }}</span>
			</p>
		</template>
	</component>

	<button class="more" v-if="more" @click="fetchMore" :disabled="moreFetching">
		<template v-if="moreFetching"><fa icon="spinner" pulse fixed-width/></template>
		{{ moreFetching ? $t('@.loading') : $t('@.load-more') }}
	</button>

	<p class="empty" v-if="empty">{{ $t('empty') }}</p>

	<mk-error v-if="error" @retry="init()"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import paging from '../../../common/scripts/paging';

export default Vue.extend({
	i18n: i18n('mobile/views/components/notifications.vue'),

	mixins: [
		paging({
			beforeInit: (self) => {
				self.$emit('beforeInit');
			},
			onInited: (self) => {
				self.$emit('inited');
			}
		}),
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
				limit: 15,
				params: () => ({
					includeTypes: this.type ? [this.type] : undefined
				})
			}
		};
	},

	computed: {
		_notifications(): any[] {
			return (this.items as any).map(notification => {
				const date = new Date(notification.createdAt).getDate();
				const month = new Date(notification.createdAt).getMonth() + 1;
				notification._date = date;
				notification._datetext = this.$t('@.month-and-day').replace('{month}', month.toString()).replace('{day}', date.toString());
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

<style lang="stylus" scoped>
.mk-notifications
	.transition
		.mk-notifications-enter
		.mk-notifications-leave-to
			opacity 0
			transform translateY(-30px)

		> *
			transition transform .3s ease, opacity .3s ease

	> .notifications

		> .mk-notification:not(:last-child)
			border-bottom solid var(--lineWidth) var(--faceDivider)

		> .date
			display block
			margin 0
			line-height 32px
			text-align center
			font-size 0.8em
			color var(--dateDividerFg)
			background var(--dateDividerBg)
			border-bottom solid var(--lineWidth) var(--faceDivider)

			span
				margin 0 16px

			[data-icon]
				margin-right 8px

	> .more
		display block
		width 100%
		padding 16px
		color var(--text)
		border-top solid var(--lineWidth) rgba(#000, 0.05)

		> [data-icon]
			margin-right 4px

	> .empty
		margin 0
		padding 16px
		text-align center
		color var(--text)

	> .placeholder
		padding 32px
		opacity 0.3

</style>
