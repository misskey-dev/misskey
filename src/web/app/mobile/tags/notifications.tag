<mk-notifications>
	<div class="notifications" v-if="notifications.length != 0">
		<template each={ notification, i in notifications }>
			<mk-notification notification={ notification }/>
			<p class="date" v-if="i != notifications.length - 1 && notification._date != notifications[i + 1]._date"><span>%fa:angle-up%{ notification._datetext }</span><span>%fa:angle-down%{ notifications[i + 1]._datetext }</span></p>
		</template>
	</div>
	<button class="more" v-if="moreNotifications" @click="fetchMoreNotifications" disabled={ fetchingMoreNotifications }>
		<template v-if="fetchingMoreNotifications">%fa:spinner .pulse .fw%</template>{ fetchingMoreNotifications ? '%i18n:common.loading%' : '%i18n:mobile.tags.mk-notifications.more%' }
	</button>
	<p class="empty" v-if="notifications.length == 0 && !loading">%i18n:mobile.tags.mk-notifications.empty%</p>
	<p class="loading" v-if="loading">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
	<style lang="stylus" scoped>
		:scope
			display block
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

				> mk-notification
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

			> .loading
				margin 0
				padding 16px
				text-align center
				color #aaa

				> [data-fa]
					margin-right 4px

	</style>
	<script lang="typescript">
		import getPostSummary from '../../../../common/get-post-summary.ts';
		this.getPostSummary = getPostSummary;

		this.mixin('api');

		this.mixin('stream');
		this.connection = this.stream.getConnection();
		this.connectionId = this.stream.use();

		this.notifications = [];
		this.loading = true;

		this.on('mount', () => {
			const max = 10;

			this.api('i/notifications', {
				limit: max + 1
			}).then(notifications => {
				if (notifications.length == max + 1) {
					this.moreNotifications = true;
					notifications.pop();
				}

				this.update({
					loading: false,
					notifications: notifications
				});

				this.trigger('fetched');
			});

			this.connection.on('notification', this.onNotification);
		});

		this.on('unmount', () => {
			this.connection.off('notification', this.onNotification);
			this.stream.dispose(this.connectionId);
		});

		this.on('update', () => {
			this.notifications.forEach(notification => {
				const date = new Date(notification.created_at).getDate();
				const month = new Date(notification.created_at).getMonth() + 1;
				notification._date = date;
				notification._datetext = `${month}月 ${date}日`;
			});
		});

		this.onNotification = notification => {
			// TODO: ユーザーが画面を見てないと思われるとき(ブラウザやタブがアクティブじゃないなど)は送信しない
			this.connection.send({
				type: 'read_notification',
				id: notification.id
			});

			this.notifications.unshift(notification);
			this.update();
		};

		this.fetchMoreNotifications = () => {
			this.update({
				fetchingMoreNotifications: true
			});

			const max = 30;

			this.api('i/notifications', {
				limit: max + 1,
				until_id: this.notifications[this.notifications.length - 1].id
			}).then(notifications => {
				if (notifications.length == max + 1) {
					this.moreNotifications = true;
					notifications.pop();
				} else {
					this.moreNotifications = false;
				}
				this.update({
					notifications: this.notifications.concat(notifications),
					fetchingMoreNotifications: false
				});
			});
		};
	</script>
</mk-notifications>
