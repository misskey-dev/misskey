<mk-notifications>
	<div class="notifications" v-if="notifications.length != 0">
		<virtual each={ notification, i in notifications }>
			<div class="notification { notification.type }">
				<mk-time time={ notification.created_at }/>
				<virtual v-if="notification.type == 'reaction'">
					<a class="avatar-anchor" href={ '/' + notification.user.username } data-user-preview={ notification.user.id }>
						<img class="avatar" src={ notification.user.avatar_url + '?thumbnail&size=48' } alt="avatar"/>
					</a>
					<div class="text">
						<p><mk-reaction-icon reaction={ notification.reaction }/><a href={ '/' + notification.user.username } data-user-preview={ notification.user.id }>{ notification.user.name }</a></p>
						<a class="post-ref" href={ '/' + notification.post.user.username + '/' + notification.post.id }>
							%fa:quote-left%{ getPostSummary(notification.post) }%fa:quote-right%
						</a>
					</div>
				</virtual>
				<virtual v-if="notification.type == 'repost'">
					<a class="avatar-anchor" href={ '/' + notification.post.user.username } data-user-preview={ notification.post.user_id }>
						<img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&size=48' } alt="avatar"/>
					</a>
					<div class="text">
						<p>%fa:retweet%<a href={ '/' + notification.post.user.username } data-user-preview={ notification.post.user_id }>{ notification.post.user.name }</a></p>
						<a class="post-ref" href={ '/' + notification.post.user.username + '/' + notification.post.id }>
							%fa:quote-left%{ getPostSummary(notification.post.repost) }%fa:quote-right%
						</a>
					</div>
				</virtual>
				<virtual v-if="notification.type == 'quote'">
					<a class="avatar-anchor" href={ '/' + notification.post.user.username } data-user-preview={ notification.post.user_id }>
						<img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&size=48' } alt="avatar"/>
					</a>
					<div class="text">
						<p>%fa:quote-left%<a href={ '/' + notification.post.user.username } data-user-preview={ notification.post.user_id }>{ notification.post.user.name }</a></p>
						<a class="post-preview" href={ '/' + notification.post.user.username + '/' + notification.post.id }>{ getPostSummary(notification.post) }</a>
					</div>
				</virtual>
				<virtual v-if="notification.type == 'follow'">
					<a class="avatar-anchor" href={ '/' + notification.user.username } data-user-preview={ notification.user.id }>
						<img class="avatar" src={ notification.user.avatar_url + '?thumbnail&size=48' } alt="avatar"/>
					</a>
					<div class="text">
						<p>%fa:user-plus%<a href={ '/' + notification.user.username } data-user-preview={ notification.user.id }>{ notification.user.name }</a></p>
					</div>
				</virtual>
				<virtual v-if="notification.type == 'reply'">
					<a class="avatar-anchor" href={ '/' + notification.post.user.username } data-user-preview={ notification.post.user_id }>
						<img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&size=48' } alt="avatar"/>
					</a>
					<div class="text">
						<p>%fa:reply%<a href={ '/' + notification.post.user.username } data-user-preview={ notification.post.user_id }>{ notification.post.user.name }</a></p>
						<a class="post-preview" href={ '/' + notification.post.user.username + '/' + notification.post.id }>{ getPostSummary(notification.post) }</a>
					</div>
				</virtual>
				<virtual v-if="notification.type == 'mention'">
					<a class="avatar-anchor" href={ '/' + notification.post.user.username } data-user-preview={ notification.post.user_id }>
						<img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&size=48' } alt="avatar"/>
					</a>
					<div class="text">
						<p>%fa:at%<a href={ '/' + notification.post.user.username } data-user-preview={ notification.post.user_id }>{ notification.post.user.name }</a></p>
						<a class="post-preview" href={ '/' + notification.post.user.username + '/' + notification.post.id }>{ getPostSummary(notification.post) }</a>
					</div>
				</virtual>
				<virtual v-if="notification.type == 'poll_vote'">
					<a class="avatar-anchor" href={ '/' + notification.user.username } data-user-preview={ notification.user.id }>
						<img class="avatar" src={ notification.user.avatar_url + '?thumbnail&size=48' } alt="avatar"/>
					</a>
					<div class="text">
						<p>%fa:chart-pie%<a href={ '/' + notification.user.username } data-user-preview={ notification.user.id }>{ notification.user.name }</a></p>
						<a class="post-ref" href={ '/' + notification.post.user.username + '/' + notification.post.id }>
							%fa:quote-left%{ getPostSummary(notification.post) }%fa:quote-right%
						</a>
					</div>
				</virtual>
			</div>
			<p class="date" v-if="i != notifications.length - 1 && notification._date != notifications[i + 1]._date">
				<span>%fa:angle-up%{ notification._datetext }</span>
				<span>%fa:angle-down%{ notifications[i + 1]._datetext }</span>
			</p>
		</virtual>
	</div>
	<button class="more { fetching: fetchingMoreNotifications }" v-if="moreNotifications" @click="fetchMoreNotifications" disabled={ fetchingMoreNotifications }>
		<virtual v-if="fetchingMoreNotifications">%fa:spinner .pulse .fw%</virtual>{ fetchingMoreNotifications ? '%i18n:common.loading%' : '%i18n:desktop.tags.mk-notifications.more%' }
	</button>
	<p class="empty" v-if="notifications.length == 0 && !loading">ありません！</p>
	<p class="loading" v-if="loading">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
	<style lang="stylus" scoped>
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

						[data-fa]
							font-size 1em
							font-weight normal
							font-style normal
							display inline-block
							margin-right 3px

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

					[data-fa]
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

		this.mixin('i');
		this.mixin('api');
		this.mixin('user-preview');

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
