mk-timeline-post(class={ repost: is-repost })

	div.reply-to(if={ p.reply_to })
		mk-timeline-post-sub(post={ p.reply_to })

	div.repost(if={ is-repost })
		p
			a.avatar-anchor(href={ CONFIG.url + '/' + post.user.username }): img.avatar(src={ post.user.avatar_url + '?thumbnail&size=64' }, alt='avatar')
			i.fa.fa-retweet
			a.name(href={ CONFIG.url + '/' + post.user.username }) { post.user.name }
			| がRepost
		mk-time(time={ post.created_at })

	article
		a.avatar-anchor(href={ CONFIG.url + '/' + p.user.username })
			img.avatar(src={ p.user.avatar_url + '?thumbnail&size=96' }, alt='avatar')
		div.main
			header
				a.name(href={ CONFIG.url + '/' + p.user.username })
					| { p.user.name }
				span.username
					| @{ p.user.username }
				a.created-at(href={ url })
					mk-time(time={ p.created_at })
			div.body
				div.text
					a.reply(if={ p.reply_to }): i.fa.fa-reply
					soan@text
					a.quote(if={ p.repost != null }) RP:
				div.media(if={ p.media })
					mk-images-viewer(images={ p.media })
				div.repost(if={ p.repost })
					i.fa.fa-quote-right.fa-flip-horizontal
					mk-post-preview.repost(post={ p.repost })
			footer
				button(onclick={ reply })
					i.fa.fa-reply
					p.count(if={ p.replies_count > 0 }) { p.replies_count }
				button(onclick={ repost }, title='Repost')
					i.fa.fa-retweet
					p.count(if={ p.repost_count > 0 }) { p.repost_count }
				button(class={ liked: p.is_liked }, onclick={ like })
					i.fa.fa-thumbs-o-up
					p.count(if={ p.likes_count > 0 }) { p.likes_count }

style.
	display block
	margin 0
	padding 0
	font-size 12px

	@media (min-width 350px)
		font-size 14px

	@media (min-width 500px)
		font-size 16px

	> .repost
		color #9dbb00
		background linear-gradient(to bottom, #edfde2 0%, #fff 100%)

		> p
			margin 0
			padding 8px 16px
			line-height 28px

			@media (min-width 500px)
				padding 16px

			.avatar-anchor
				display inline-block

				.avatar
					vertical-align bottom
					width 28px
					height 28px
					margin 0 8px 0 0
					border-radius 6px

			i
				margin-right 4px

			.name
				font-weight bold

		> mk-time
			position absolute
			top 8px
			right 16px
			font-size 0.9em
			line-height 28px

			@media (min-width 500px)
				top 16px

		& + article
			padding-top 8px

	> .reply-to
		background rgba(0, 0, 0, 0.0125)

		> mk-post-preview
			background transparent

	> article
		padding 14px 16px 9px 16px

		&:after
			content ""
			display block
			clear both

		> .avatar-anchor
			display block
			float left
			margin 0 10px 0 0

			@media (min-width 500px)
				margin-right 16px

			> .avatar
				display block
				width 48px
				height 48px
				margin 0
				border-radius 6px
				vertical-align bottom

				@media (min-width 500px)
					width 58px
					height 58px
					border-radius 8px

		> .main
			float left
			width calc(100% - 58px)

			@media (min-width 500px)
				width calc(100% - 74px)

			> header
				white-space nowrap

				@media (min-width 500px)
					margin-bottom 2px

				> .name
					display inline
					margin 0
					padding 0
					color #777
					font-size 1em
					font-weight 700
					text-align left
					text-decoration none

					&:hover
						text-decoration underline

				> .username
					text-align left
					margin 0 0 0 8px
					color #ccc

				> .created-at
					position absolute
					top 0
					right 0
					font-size 0.9em
					color #c0c0c0

			> .body

				> .text
					cursor default
					display block
					margin 0
					padding 0
					word-wrap break-word
					font-size 1.1em
					color #717171

					mk-url-preview
						margin-top 8px

					> .reply
						margin-right 8px
						color #717171

					> .quote
						margin-left 4px
						font-style oblique
						color #a0bf46

				> .media
					> img
						display block
						max-width 100%

				> .repost
					margin 8px 0

					> i:first-child
						position absolute
						top -8px
						left -8px
						z-index 1
						color #c0dac6
						font-size 28px
						background #fff

					> mk-post-preview
						padding 16px
						border dashed 1px #c0dac6
						border-radius 8px

			> footer
				> button
					margin 0 28px 0 0
					padding 8px
					background transparent
					border none
					box-shadow none
					font-size 1em
					color #ddd
					cursor pointer

					&:hover
						color #666

					> .count
						display inline
						margin 0 0 0 8px
						color #999

					&.liked
						color $theme-color

script.
	@mixin \api
	@mixin \text
	@mixin \get-post-summary
	@mixin \open-post-form

	@post = @opts.post
	@is-repost = @post.repost? and !@post.text?
	@p = if @is-repost then @post.repost else @post
	@summary = @get-post-summary @p
	@url = CONFIG.url + '/' + @p.user.username + '/' + @p.id

	@on \mount ~>
		if @p.text?
			tokens = if @p._highlight?
				then @analyze @p._highlight
				else @analyze @p.text

			@refs.text.innerHTML = if @p._highlight?
				then @compile tokens, true, false
				else @compile tokens

			@refs.text.children.for-each (e) ~>
				if e.tag-name == \MK-URL
					riot.mount e

			# URLをプレビュー
			tokens
				.filter (t) -> t.type == \link
				.map (t) ~>
					@preview = @refs.text.append-child document.create-element \mk-url-preview
					riot.mount @preview, do
						url: t.content

	@reply = ~>
		@open-post-form do
			reply: @p

	@repost = ~>
		text = window.prompt '「' + @summary + '」をRepost'
		if text?
			@api \posts/create do
				repost_id: @p.id
				text: if text == '' then undefined else text

	@like = ~>
		if @p.is_liked
			@api \posts/likes/delete do
				post_id: @p.id
			.then ~>
				@p.is_liked = false
				@update!
		else
			@api \posts/likes/create do
				post_id: @p.id
			.then ~>
				@p.is_liked = true
				@update!
