<template>
<div class="mk-notifications">
	<div class="notifications" v-if="notifications.length != 0">
		<template v-for="(notification, i) in _notifications">
			<mk-notification :notification="notification" :key="notification.id"/>
			<p class="date" v-if="i != notifications.length - 1 && notification._date != _notifications[i + 1]._date">
				<span>%fa:angle-up%{{ notification._datetext }}</span>
				<span>%fa:angle-down%{{ _notifications[i + 1]._datetext }}</span>
			</p>
		</template>
	</div>
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
			connection: null,
			connectionId: null
		};
	},
	computed: {
		_notifications(): any[] {
			return (this.notifications as any).map(notification => {
				const date = new Date(notification.createdAt).getDate();
				const month = new Date(notification.createdAt).getMonth() + 1;
				notification._date = date;
				notification._datetext = `${month}月 ${date}日`;
				return notification;
			});
		}
	},
	mounted() {
		this.connection = (this as any).os.stream.getConnection();
		this.connectionId = (this as any).os.stream.use();

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
		this.connection.off('notification', this.onNotification);
		(this as any).os.stream.dispose(this.connectionId);
	},
	methods: {
		fetchMoreNotifications() {
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
			this.connection.send({
				type: 'read_notification',
				id: notification.id
			});

			this.notifications.unshift(notification);
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-notifications
	margin 8px auto
	padding 0
	max-width 500px
	width calc(100% - 16px)
	background #fff
	border-radius 8px
	box-shadow 0 0 0 1px rgba(0, 0, 0, 0.2)

	@media (min-width 500px)
		margin 16px auto
		width calc(100% - 32px)

	> .notifications

		> .mk-notification
			margin 0 auto
			max-width 500px
			border-bottom solid 1px rgba(0, 0, 0, 0.05)

			&:last-child
				border-bottom none

		> .date
			display block
			margin 0
			line-height 32px
			text-align center
			font-size 0.8em
			color #aaa
			background #fdfdfd
			border-bottom solid 1px rgba(0, 0, 0, 0.05)

			span
				margin 0 16px

			i
				margin-right 8px

	> .more
		display block
		width 100%
		padding 16px
		color #555
		border-top solid 1px rgba(0, 0, 0, 0.05)

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
