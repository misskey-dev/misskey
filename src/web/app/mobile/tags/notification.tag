<mk-notification class={ notification.type }>
	<mk-time time={ notification.created_at }></mk-time>
	<virtual if={ notification.type == 'like' }>
		<a class="avatar-anchor" href={ CONFIG.url + '/' + notification.user.username }>
			<img class="avatar" src={ notification.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		</a>
		<div class="text">
			<p>
				<i class="fa fa-thumbs-o-up"></i>
				<a href={ CONFIG.url + '/' + notification.user.username }>{ notification.user.name }</a>
			</p>
			<a class="post-ref" href={ CONFIG.url + '/' + notification.post.user.username + '/' + notification.post.id }>{ getPostSummary(notification.post) }</a>
		</div>
	</virtual>
	<virtual if={ notification.type == 'repost' }>
		<a class="avatar-anchor" href={ CONFIG.url + '/' + notification.post.user.username }>
			<img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		</a>
		<div class="text">
			<p>
				<i class="fa fa-retweet"></i>
				<a href={ CONFIG.url + '/' + notification.post.user.username }>{ notification.post.user.name }</a>
			</p>
			<a class="post-ref" href={ CONFIG.url + '/' + notification.post.user.username + '/' + notification.post.id }>{ getPostSummary(notification.post.repost) }</a>
		</div>
	</virtual>
	<virtual if={ notification.type == 'quote' }>
		<a class="avatar-anchor" href={ CONFIG.url + '/' + notification.post.user.username }>
			<img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		</a>
		<div class="text">
			<p>
				<i class="fa fa-quote-left"></i>
				<a href={ CONFIG.url + '/' + notification.post.user.username }>{ notification.post.user.name }</a>
			</p>
			<a class="post-preview" href={ CONFIG.url + '/' + notification.post.user.username + '/' + notification.post.id }>{ getPostSummary(notification.post) }</a>
		</div>
	</virtual>
	<virtual if={ notification.type == 'follow' }>
		<a class="avatar-anchor" href={ CONFIG.url + '/' + notification.user.username }>
			<img class="avatar" src={ notification.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		</a>
		<div class="text">
			<p>
				<i class="fa fa-user-plus"></i>
				<a href={ CONFIG.url + '/' + notification.user.username }>{ notification.user.name }</a>
			</p>
		</div>
	</virtual>
	<virtual if={ notification.type == 'reply' }>
		<a class="avatar-anchor" href={ CONFIG.url + '/' + notification.post.user.username }>
			<img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		</a>
		<div class="text">
			<p>
				<i class="fa fa-reply"></i>
				<a href={ CONFIG.url + '/' + notification.post.user.username }>{ notification.post.user.name }</a>
			</p>
			<a class="post-preview" href={ CONFIG.url + '/' + notification.post.user.username + '/' + notification.post.id }>{ getPostSummary(notification.post) }</a>
		</div>
	</virtual>
	<virtual if={ notification.type == 'mention' }>
		<a class="avatar-anchor" href={ CONFIG.url + '/' + notification.post.user.username }>
			<img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		</a>
		<div class="text">
			<p>
				<i class="fa fa-at"></i>
				<a href={ CONFIG.url + '/' + notification.post.user.username }>{ notification.post.user.name }</a>
			</p>
			<a class="post-preview" href={ CONFIG.url + '/' + notification.post.user.username + '/' + notification.post.id }>{ getPostSummary(notification.post) }</a>
		</div>
	</virtual>
	<virtual if={ notification.type == 'poll_vote' }>
		<a class="avatar-anchor" href={ CONFIG.url + '/' + notification.user.username }>
			<img class="avatar" src={ notification.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		</a>
		<div class="text">
			<p>
				<i class="fa fa-pie-shart"></i>
				<a href={ CONFIG.url + '/' + notification.user.username }>{ notification.user.name }</a>
			</p>
			<a class="post-ref" href={ CONFIG.url + '/' + notification.post.user.username + '/' + notification.post.id }>{ getPostSummary(notification.post) }</a>
		</div>
	</virtual>
	<style type="stylus">
		:scope
			display block
			margin 0
			padding 16px
			overflow-wrap break-word

			> mk-time
				display inline
				position absolute
				top 16px
				right 12px
				vertical-align top
				color rgba(0, 0, 0, 0.6)
				font-size 12px

			&:after
				content ""
				display block
				clear both

			.avatar-anchor
				display block
				float left

				img
					min-width 36px
					min-height 36px
					max-width 36px
					max-height 36px
					border-radius 6px

			.text
				float right
				width calc(100% - 36px)
				padding-left 8px

				p
					margin 0

					i
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

			&.like
				.text p i
					color #FFAC33

			&.repost, &.quote
				.text p i
					color #77B255

			&.follow
				.text p i
					color #53c7ce

			&.reply, &.mention
				.text p i
					color #555

				.post-preview
					color rgba(0, 0, 0, 0.7)

	</style>
	<script>
		@mixin \get-post-summary
		@notification = @opts.notification
	</script>
</mk-notification>
