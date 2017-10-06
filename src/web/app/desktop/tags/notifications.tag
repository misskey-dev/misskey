<mk-notifications>
	<div class="notifications" if={ notifications.length != 0 }>
		<virtual each={ notification, i in notifications }>
			<div class="notification { notification.type }">
				<mk-time time={ notification.created_at }/>
				<virtual if={ notification.type == 'reaction' }>
					<a class="avatar-anchor" href={ '/' + notification.user.username } data-user-preview={ notification.user.id }>
						<img class="avatar" src={ notification.user.avatar_url + '?thumbnail&size=48' } alt="avatar"/>
					</a>
					<div class="text">
						<p><mk-reaction-icon reaction={ notification.reaction }/><a href={ '/' + notification.user.username } data-user-preview={ notification.user.id }>{ notification.user.name }</a></p><a class="post-ref" href={ '/' + notification.post.user.username + '/' + notification.post.id }>{ getPostSummary(notification.post) }</a>
					</div>
				</virtual>
				<virtual if={ notification.type == 'repost' }>
					<a class="avatar-anchor" href={ '/' + notification.post.user.username } data-user-preview={ notification.post.user_id }>
						<img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&size=48' } alt="avatar"/>
					</a>
					<div class="text">
						<p><i class="fa fa-retweet"></i><a href={ '/' + notification.post.user.username } data-user-preview={ notification.post.user_id }>{ notification.post.user.name }</a></p><a class="post-ref" href={ '/' + notification.post.user.username + '/' + notification.post.id }>{ getPostSummary(notification.post.repost) }</a>
					</div>
				</virtual>
				<virtual if={ notification.type == 'quote' }>
					<a class="avatar-anchor" href={ '/' + notification.post.user.username } data-user-preview={ notification.post.user_id }>
						<img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&size=48' } alt="avatar"/>
					</a>
					<div class="text">
						<p><i class="fa fa-quote-left"></i><a href={ '/' + notification.post.user.username } data-user-preview={ notification.post.user_id }>{ notification.post.user.name }</a></p><a class="post-preview" href={ '/' + notification.post.user.username + '/' + notification.post.id }>{ getPostSummary(notification.post) }</a>
					</div>
				</virtual>
				<virtual if={ notification.type == 'follow' }>
					<a class="avatar-anchor" href={ '/' + notification.user.username } data-user-preview={ notification.user.id }>
						<img class="avatar" src={ notification.user.avatar_url + '?thumbnail&size=48' } alt="avatar"/>
					</a>
					<div class="text">
						<p><i class="fa fa-user-plus"></i><a href={ '/' + notification.user.username } data-user-preview={ notification.user.id }>{ notification.user.name }</a></p>
					</div>
				</virtual>
				<virtual if={ notification.type == 'reply' }>
					<a class="avatar-anchor" href={ '/' + notification.post.user.username } data-user-preview={ notification.post.user_id }>
						<img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&size=48' } alt="avatar"/>
					</a>
					<div class="text">
						<p><i class="fa fa-reply"></i><a href={ '/' + notification.post.user.username } data-user-preview={ notification.post.user_id }>{ notification.post.user.name }</a></p><a class="post-preview" href={ '/' + notification.post.user.username + '/' + notification.post.id }>{ getPostSummary(notification.post) }</a>
					</div>
				</virtual>
				<virtual if={ notification.type == 'mention' }>
					<a class="avatar-anchor" href={ '/' + notification.post.user.username } data-user-preview={ notification.post.user_id }>
						<img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&size=48' } alt="avatar"/>
					</a>
					<div class="text">
						<p><i class="fa fa-at"></i><a href={ '/' + notification.post.user.username } data-user-preview={ notification.post.user_id }>{ notification.post.user.name }</a></p><a class="post-preview" href={ '/' + notification.post.user.username + '/' + notification.post.id }>{ getPostSummary(notification.post) }</a>
					</div>
				</virtual>
				<virtual if={ notification.type == 'poll_vote' }>
					<a class="avatar-anchor" href={ '/' + notification.user.username } data-user-preview={ notification.user.id }>
						<img class="avatar" src={ notification.user.avatar_url + '?thumbnail&size=48' } alt="avatar"/>
					</a>
					<div class="text">
						<p><i class="fa fa-pie-chart"></i><a href={ '/' + notification.user.username } data-user-preview={ notification.user.id }>{ notification.user.name }</a></p><a class="post-ref" href={ '/' + notification.post.user.username + '/' + notification.post.id }>{ getPostSummary(notification.post) }</a>
					</div>
				</virtual>
			</div>
			<p class="date" if={ i != notifications.length - 1 && notification._date != notifications[i + 1]._date }><span><i class="fa fa-angle-up"></i>{ notification._datetext }</span><span><i class="fa fa-angle-down"></i>{ notifications[i + 1]._datetext }</span></p>
		</virtual>
	</div>
	<button class="more { fetching: fetchingMoreNotifications }" if={ moreNotifications } onclick={ fetchMoreNotifications } disabled={ fetchingMoreNotifications }>
		<i class="fa fa-spinner fa-pulse fa-fw" if={ fetchingMoreNotifications }></i>{ fetchingMoreNotifications ? '%i18n:common.loading%' : '%i18n:desktop.tags.mk-notifications.more%' }
	</button>
	<p class="empty" if={ notifications.length == 0 && !loading }>ありません！</p>
	<p class="loading" if={ loading }><i class="fa fa-spinner fa-pulse fa-fw"></i>%i18n:common.loading%<mk-ellipsis/></p>
	<style>
		:scope
			display block

			> .notifications
				> .notification
					margin 0
					padding 16px
					overflow-wrap break-word
					font-size 0.9em
					border-bottom solid 1px rgba(0, 0, 0, 0.05)

					&:last-child
						border-bottom none

					> mk-time
						display inline
						position absolute
						top 16px
						right 12px
						vertical-align top
						color rgba(0, 0, 0, 0.6)
						font-size small

					&:after
						content ""
						display block
						clear both

					> .avatar-anchor
						display block
						float left
						position -webkit-sticky
						position sticky
						top 16px

						> img
							display block
							min-width 36px
							min-height 36px
							max-width 36px
							max-height 36px
							border-radius 6px

					> .text
						float right
						width calc(100% - 36px)
						padding-left 8px

						p
							margin 0

							i, mk-reaction-icon
								margin-right 4px

					.post-preview
						color rgba(0, 0, 0, 0.7)

					.post-ref
						color rgba(0, 0, 0, 0.7)

						&:before, &:after
							font-family FontAwesome
							font-size 1em
							font-weight normal
							font-style normal
							display inline-block
							margin-right 3px

						&:before
							content "\f10d"

						&:after
							content "\f10e"

					&.repost, &.quote
						.text p i
							color #77B255

					&.follow
						.text p i
							color #53c7ce

					&.reply, &.mention
						.text p i
							color #555

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

				&:hover
					background rgba(0, 0, 0, 0.025)

				&:active
					background rgba(0, 0, 0, 0.05)

				&.fetching
					cursor wait

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

		this.mixin('i');
		this.mixin('api');
		this.mixin('stream');
		this.mixin('user-preview');

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
