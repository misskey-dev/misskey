<template>
<div class="oxynyeqmfvracxnglgulyqfgqxnxmehl">
	<div class="placeholder" v-if="fetching">
		<template v-for="i in 10">
			<mk-note-skeleton :key="i"/>
		</template>
	</div>

	<!-- トランジションを有効にするとなぜかメモリリークする -->
	<component :is="!$store.state.device.reduceMotion ? 'transition-group' : 'div'" name="mk-notifications" class="transition notifications" tag="div">
		<template v-for="(notification, i) in _notifications">
			<x-notification class="notification" :notification="notification" :key="notification.id"/>
			<p class="date" v-if="i != notifications.length - 1 && notification._date != _notifications[i + 1]._date" :key="notification.id + '-time'">
				<span><fa icon="angle-up"/>{{ notification._datetext }}</span>
				<span><fa icon="angle-down"/>{{ _notifications[i + 1]._datetext }}</span>
			</p>
		</template>
	</component>
	<button class="more" :class="{ fetching: fetchingMoreNotifications }" v-if="moreNotifications" @click="fetchMoreNotifications" :disabled="fetchingMoreNotifications">
		<template v-if="fetchingMoreNotifications"><fa icon="spinner" pulse fixed-width/></template>{{ fetchingMoreNotifications ? this.$t('@.loading') : this.$t('@.load-more') }}
	</button>
	<p class="empty" v-if="notifications.length == 0 && !fetching">{{ $t('empty') }}</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import XNotification from './deck.notification.vue';

const displayLimit = 20;

export default Vue.extend({
	i18n: i18n(),
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
				notification._datetext = this.$t('@.month-and-day').replace('{month}', month.toString()).replace('{day}', date.toString());
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
		this.connection = this.$root.stream.useSharedConnection('main');

		this.connection.on('notification', this.onNotification);

		this.column.$on('top', this.onTop);
		this.column.$on('bottom', this.onBottom);

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
			for (const n of this.queue) {
				this.prepend(n);
			}
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

	> .placeholder
		padding 16px
		opacity 0.3

	> .notifications

		> .notification:not(:last-child)
			border-bottom solid var(--lineWidth) var(--faceDivider)

		> .date
			display block
			margin 0
			line-height 28px
			text-align center
			font-size 12px
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

		&:hover
			background rgba(#000, 0.025)

		&:active
			background rgba(#000, 0.05)

		&.fetching
			cursor wait

		> [data-icon]
			margin-right 4px

	> .empty
		margin 0
		padding 16px
		text-align center
		color var(--text)

</style>
