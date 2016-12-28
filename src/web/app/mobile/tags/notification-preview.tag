mk-notification-preview(class={ notification.type })
	div.main(if={ notification.type == 'like' })
		img.avatar(src={ notification.user.avatar_url + '?thumbnail&size=64' }, alt='avatar')
		div.text
			p
				i.fa.fa-thumbs-o-up
				| { notification.user.name }
			p.post-ref { get-post-summary(notification.post) }

	div.main(if={ notification.type == 'repost' })
		img.avatar(src={ notification.post.user.avatar_url + '?thumbnail&size=64' }, alt='avatar')
		div.text
			p
				i.fa.fa-retweet
				| { notification.post.user.name }
			p.post-ref { get-post-summary(notification.post.repost) }

	div.main(if={ notification.type == 'quote' })
		img.avatar(src={ notification.post.user.avatar_url + '?thumbnail&size=64' }, alt='avatar')
		div.text
			p
				i.fa.fa-quote-left
				| { notification.post.user.name }
			p.post-preview { get-post-summary(notification.post) }

	div.main(if={ notification.type == 'follow' })
		img.avatar(src={ notification.user.avatar_url + '?thumbnail&size=64' }, alt='avatar')
		div.text
			p
				i.fa.fa-user-plus
				| { notification.user.name }

	div.main(if={ notification.type == 'reply' })
		img.avatar(src={ notification.post.user.avatar_url + '?thumbnail&size=64' }, alt='avatar')
		div.text
			p
				i.fa.fa-reply
				| { notification.post.user.name }
			p.post-preview { get-post-summary(notification.post) }

	div.main(if={ notification.type == 'mention' })
		img.avatar(src={ notification.post.user.avatar_url + '?thumbnail&size=64' }, alt='avatar')
		div.text
			p
				i.fa.fa-at
				| { notification.post.user.name }
			p.post-preview { get-post-summary(notification.post) }

style.
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

script.
	@mixin \get-post-summary
	@notification = @opts.notification
