<mk-notification-preview class={ notification.type }>
	<div class="main" if={ notification.type == 'like' }><img class="avatar" src={ notification.user.avatar_url + '?thumbnail&amp;size=64' } alt="avatar"/>
		<div class="text">
			<p><i class="fa fa-thumbs-o-up"></i>{ notification.user.name }</p>
			<p class="post-ref">{ getPostSummary(notification.post) }</p>
		</div>
	</div>
	<div class="main" if={ notification.type == 'repost' }><img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&amp;size=64' } alt="avatar"/>
		<div class="text">
			<p><i class="fa fa-retweet"></i>{ notification.post.user.name }</p>
			<p class="post-ref">{ getPostSummary(notification.post.repost) }</p>
		</div>
	</div>
	<div class="main" if={ notification.type == 'quote' }><img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&amp;size=64' } alt="avatar"/>
		<div class="text">
			<p><i class="fa fa-quote-left"></i>{ notification.post.user.name }</p>
			<p class="post-preview">{ getPostSummary(notification.post) }</p>
		</div>
	</div>
	<div class="main" if={ notification.type == 'follow' }><img class="avatar" src={ notification.user.avatar_url + '?thumbnail&amp;size=64' } alt="avatar"/>
		<div class="text">
			<p><i class="fa fa-user-plus"></i>{ notification.user.name }</p>
		</div>
	</div>
	<div class="main" if={ notification.type == 'reply' }><img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&amp;size=64' } alt="avatar"/>
		<div class="text">
			<p><i class="fa fa-reply"></i>{ notification.post.user.name }</p>
			<p class="post-preview">{ getPostSummary(notification.post) }</p>
		</div>
	</div>
	<div class="main" if={ notification.type == 'mention' }><img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&amp;size=64' } alt="avatar"/>
		<div class="text">
			<p><i class="fa fa-at"></i>{ notification.post.user.name }</p>
			<p class="post-preview">{ getPostSummary(notification.post) }</p>
		</div>
	</div>
	<style type="stylus">
		:scope
			display block
			margin 0
			padding 8px
			color #fff

			> .main
				word-wrap break-word

			&:after
				content ""
				display block
				clear both

			img
				display block
				float left
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

			.post-ref

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
					color #fff

	</style>
	<script>
		@mixin \get-post-summary
		@notification = @opts.notification
	</script>
</mk-notification-preview>
