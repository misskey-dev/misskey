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
			<mk-notification :notification="notification" :key="notification.id"/>
			<p class="date" :key="notification.id + '_date'" v-if="i != notifications.length - 1 && notification._date != _notifications[i + 1]._date">
				<span><fa icon="angle-up"/>{{ notification._datetext }}</span>
				<span><fa icon="angle-down"/>{{ _notifications[i + 1]._datetext }}</span>
			</p>
		</template>
	</component>

	<button class="more" v-if="moreNotifications" @click="fetchMoreNotifications" :disabled="fetchingMoreNotifications">
		<template v-if="fetchingMoreNotifications"><fa icon="spinner" pulse fixed-width/></template>
		{{ fetchingMoreNotifications ? $t('@.loading') : $t('@.load-more') }}
	</button>

	<p class="empty" v-if="notifications.length == 0 && !fetching">{{ $t('empty') }}</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('mobile/views/components/notifications.vue'),
	data() {
		return {
			fetching: true,
			fetchingMoreNotifications: false,
			notifications: [],
			moreNotifications: false,
			connection: null
		};
	},

	computed: {
		_notifications(): any[] {
			return (this.notifications as any).map(notification => {
				const date = new Date(notification.createdAt).getDate();
				const month = new Date(notification.createdAt).getMonth() + 1;
				notification._date = date;
				notification._datetext = this.$t('@.month-and-day').replace('{month}', month.toString()).replace('{day}', date.toString());
				return notification;
			});
		}
	},

	mounted() {
		window.addEventListener('scroll', this.onScroll, { passive: true });

		this.connection = this.$root.stream.useSharedConnection('main');

		this.connection.on('notification', this.onNotification);

		const max = 10;

		this.$root.api('i/notifications', {
			limit: max + 1
		}).then(notifications => {
			if (notifications.length == max + 1) {
				this.moreNotifications = true;
				notifications.pop();
			}

			this.notifications = notifications;
			this.fetching = false;
			this.$emit('fetched');
		});
	},

	beforeDestroy() {
		window.removeEventListener('scroll', this.onScroll);
		this.connection.dispose();
	},

	methods: {
		fetchMoreNotifications() {
			if (this.fetchingMoreNotifications) return;

			this.fetchingMoreNotifications = true;

			const max = 30;

			this.$root.api('i/notifications', {
				limit: max + 1,
				untilId: this.notifications[this.notifications.length - 1].id
			}).then(notifications => {
				if (notifications.length == max + 1) {
					this.moreNotifications = true;
					notifications.pop();
				} else {
					this.moreNotifications = false;
				}
				this.notifications = this.notifications.concat(notifications);
				this.fetchingMoreNotifications = false;
			});
		},

		onNotification(notification) {
			// TODO: ユーザーが画面を見てないと思われるとき(ブラウザやタブがアクティブじゃないなど)は送信しない
			this.$root.stream.send('readNotification', {
				id: notification.id
			});

			this.notifications.unshift(notification);
		},

		onScroll() {
			if (this.$store.state.settings.fetchOnScroll !== false) {
				// 親要素が display none だったら弾く
				// https://github.com/syuilo/misskey/issues/1569
				// http://d.hatena.ne.jp/favril/20091105/1257403319
				if (this.$el.offsetHeight == 0) return;

				const current = window.scrollY + window.innerHeight;
				if (current > document.body.offsetHeight - 8) this.fetchMoreNotifications();
			}
		}
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
