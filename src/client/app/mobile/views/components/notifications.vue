<template>
<div class="mk-notifications">
	<!-- トランジションを有効にするとなぜかメモリリークする -->
	<component :is="!$store.state.device.reduceMotion ? 'transition-group' : 'div'" name="mk-notifications" class="transition notifications">
		<template v-for="(notification, i) in _notifications">
			<mk-notification :notification="notification" :key="notification.id"/>
			<p class="date" :key="notification.id + '_date'" v-if="i != notifications.length - 1 && notification._date != _notifications[i + 1]._date">
				<span>%fa:angle-up%{{ notification._datetext }}</span>
				<span>%fa:angle-down%{{ _notifications[i + 1]._datetext }}</span>
			</p>
		</template>
	</component>

	<button class="more" v-if="moreNotifications" @click="fetchMoreNotifications" :disabled="fetchingMoreNotifications">
		<template v-if="fetchingMoreNotifications">%fa:spinner .pulse .fw%</template>
		{{ fetchingMoreNotifications ? '%i18n:common.loading%' : '%i18n:@more%' }}
	</button>

	<p class="empty" v-if="notifications.length == 0 && !fetching">%i18n:@empty%</p>
	<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
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
				notification._datetext = '%i18n:common.month-and-day%'.replace('{month}', month.toString()).replace('{day}', date.toString());
				return notification;
			});
		}
	},

	mounted() {
		window.addEventListener('scroll', this.onScroll, { passive: true });

		this.connection = (this as any).os.stream.useSharedConnection('main');

		this.connection.on('notification', this.onNotification);

		const max = 10;

		(this as any).api('i/notifications', {
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

			(this as any).api('i/notifications', {
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
			(this as any).os.stream.send('readNotification', {
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
	margin 0 auto
	background var(--face)
	border-radius 8px
	box-shadow 0 0 2px rgba(#000, 0.1)
	overflow hidden

	@media (min-width 500px)
		box-shadow 0 8px 32px rgba(#000, 0.1)

	.transition
		.mk-notifications-enter
		.mk-notifications-leave-to
			opacity 0
			transform translateY(-30px)

		> *
			transition transform .3s ease, opacity .3s ease

	> .notifications

		> .mk-notification:not(:last-child)
			border-bottom solid 1px var(--faceDivider)

		> .date
			display block
			margin 0
			line-height 32px
			text-align center
			font-size 0.8em
			color var(--dateDividerFg)
			background var(--dateDividerBg)
			border-bottom solid 1px var(--faceDivider)

			span
				margin 0 16px

			i
				margin-right 8px

	> .more
		display block
		width 100%
		padding 16px
		color var(--text)
		border-top solid 1px rgba(#000, 0.05)

		> [data-fa]
			margin-right 4px

	> .empty
		margin 0
		padding 16px
		text-align center
		color #aaa

	> .fetching
		margin 0
		padding 16px
		text-align center
		color #aaa

		> [data-fa]
			margin-right 4px

</style>
