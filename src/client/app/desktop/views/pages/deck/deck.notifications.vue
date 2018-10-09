<template>
<div class="oxynyeqmfvracxnglgulyqfgqxnxmehl">
	<!-- トランジションを有効にするとなぜかメモリリークする -->
	<component :is="!$store.state.device.reduceMotion ? 'transition-group' : 'div'" name="mk-notifications" class="transition notifications">
		<template v-for="(notification, i) in _notifications">
			<x-notification class="notification" :notification="notification" :key="notification.id"/>
			<p class="date" v-if="i != notifications.length - 1 && notification._date != _notifications[i + 1]._date" :key="notification.id + '-time'">
				<span>%fa:angle-up%{{ notification._datetext }}</span>
				<span>%fa:angle-down%{{ _notifications[i + 1]._datetext }}</span>
			</p>
		</template>
	</component>
	<button class="more" :class="{ fetching: fetchingMoreNotifications }" v-if="moreNotifications" @click="fetchMoreNotifications" :disabled="fetchingMoreNotifications">
		<template v-if="fetchingMoreNotifications">%fa:spinner .pulse .fw%</template>{{ fetchingMoreNotifications ? '%i18n:common.loading%' : '%i18n:@more%' }}
	</button>
	<p class="empty" v-if="notifications.length == 0 && !fetching">%i18n:@empty%</p>
	<p class="loading" v-if="fetching">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XNotification from './deck.notification.vue';

const displayLimit = 20;

export default Vue.extend({
	components: {
		XNotification
	},

	inject: ['column', 'isScrollTop', 'count'],

	data() {
		return {
			fetching: true,
			fetchingMoreNotifications: false,
			notifications: [],
			queue: [],
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

	watch: {
		queue(q) {
			this.count(q.length);
		}
	},

	mounted() {
		this.connection = (this as any).os.stream.useSharedConnection('main');

		this.connection.on('notification', this.onNotification);

		this.column.$on('top', this.onTop);
		this.column.$on('bottom', this.onBottom);

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
		});
	},

	beforeDestroy() {
		this.connection.dispose();

		this.column.$off('top', this.onTop);
		this.column.$off('bottom', this.onBottom);
	},

	methods: {
		fetchMoreNotifications() {
			this.fetchingMoreNotifications = true;

			const max = 20;

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

			this.prepend(notification);
		},

		prepend(notification) {
			if (this.isScrollTop()) {
				// Prepend the notification
				this.notifications.unshift(notification);

				// オーバーフローしたら古い通知は捨てる
				if (this.notifications.length >= displayLimit) {
					this.notifications = this.notifications.slice(0, displayLimit);
				}
			} else {
				this.queue.push(notification);
			}
		},

		releaseQueue() {
			this.queue.forEach(n => this.prepend(n));
			this.queue = [];
		},

		onTop() {
			this.releaseQueue();
		},

		onBottom() {
			this.fetchMoreNotifications();
		}
	}
});
</script>

<style lang="stylus" scoped>
.oxynyeqmfvracxnglgulyqfgqxnxmehl
	.transition
		.mk-notifications-enter
		.mk-notifications-leave-to
			opacity 0
			transform translateY(-30px)

		> *
			transition transform .3s ease, opacity .3s ease

	> .notifications

		> .notification:not(:last-child)
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
		color #555
		border-top solid 1px rgba(#000, 0.05)

		&:hover
			background rgba(#000, 0.025)

		&:active
			background rgba(#000, 0.05)

		&.fetching
			cursor wait

		> [data-fa]
			margin-right 4px

	> .empty
		margin 0
		padding 16px
		text-align center
		color #aaa

	> .loading
		margin 0
		padding 16px
		text-align center
		color #aaa

		> [data-fa]
			margin-right 4px

</style>
