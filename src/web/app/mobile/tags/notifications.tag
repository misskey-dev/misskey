<mk-notifications>
	<div class="notifications" if={ notifications.length != 0 }>
		<virtual each={ notification, i in notifications }>
			<mk-notification notification={ notification }/>
			<p class="date" if={ i != notifications.length - 1 && notification._date != notifications[i + 1]._date }><span><i class="fa fa-angle-up"></i>{ notification._datetext }</span><span><i class="fa fa-angle-down"></i>{ notifications[i + 1]._datetext }</span></p>
		</virtual>
	</div>
	<button class="more" if={ moreNotifications } onclick={ fetchMoreNotifications } disabled={ fetchingMoreNotifications }>
		<i class="fa fa-spinner fa-pulse fa-fw" if={ fetchingMoreNotifications }></i>{ fetchingMoreNotifications ? '%i18n:common.loading%' : '%i18n:mobile.tags.mk-notifications.more%' }
	</button>
	<p class="empty" if={ notifications.length == 0 && !loading }>%i18n:mobile.tags.mk-notifications.empty%</p>
	<p class="loading" if={ loading }><i class="fa fa-spinner fa-pulse fa-fw"></i>%i18n:common.loading%<mk-ellipsis/></p>
	<style>
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

				> i
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

				> i
					margin-right 4px

	</style>
	<script>
		import getPostSummary from '../../../../common/get-post-summary';
		this.getPostSummary = getPostSummary;

		this.mixin('api');
		this.mixin('stream');

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

			this.stream.on('notification', this.onNotification);
		});

		this.on('unmount', () => {
			this.stream.off('notification', this.onNotification);
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
				max_id: this.notifications[this.notifications.length - 1].id
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
