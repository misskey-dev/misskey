mk-timeline-post(tabindex='-1', title={ title }, onkeydown={ on-key-down })

	div.reply-to(if={ p.reply_to })
		mk-timeline-post-sub(post={ p.reply_to })

	div.repost(if={ is-repost })
		p
			a.avatar-anchor(href={ CONFIG.url + '/' + post.user.username }, data-user-preview={ post.user_id }): img.avatar(src={ post.user.avatar_url + '?thumbnail&size=32' }, alt='avatar')
			i.fa.fa-retweet
			a.name(href={ CONFIG.url + '/' + post.user.username }, data-user-preview={ post.user_id }) { post.user.name }
			| がRepost
		mk-time(time={ post.created_at })

	article
		a.avatar-anchor(href={ CONFIG.url + '/' + p.user.username })
			img.avatar(src={ p.user.avatar_url + '?thumbnail&size=64' }, alt='avatar', data-user-preview={ p.user.id })
		div.main
			header
				a.name(href={ CONFIG.url + '/' + p.user.username }, data-user-preview={ p.user.id })
					| { p.user.name }
				span.username
					| @{ p.user.username }
				a.created-at(href={ url })
					mk-time(time={ p.created_at })
			div.body
				div.text
					a.reply(if={ p.reply_to }): i.fa.fa-reply
					span@text
					a.quote(if={ p.repost != null }) RP:
				div.media(if={ p.media })
					mk-images-viewer(images={ p.media })
				div.repost(if={ p.repost })
					i.fa.fa-quote-right.fa-flip-horizontal
					mk-post-preview.repost(post={ p.repost })
			footer
				button(onclick={ reply }, title='返信')
					i.fa.fa-reply
					p.count(if={ p.replies_count > 0 }) { p.replies_count }
				button(onclick={ repost }, title='Repost')
					i.fa.fa-retweet
					p.count(if={ p.repost_count > 0 }) { p.repost_count }
				button(class={ liked: p.is_liked }, onclick={ like }, title='善哉')
					i.fa.fa-thumbs-o-up
					p.count(if={ p.likes_count > 0 }) { p.likes_count }
				button(onclick={ NotImplementedException }): i.fa.fa-ellipsis-h
				button(onclick={ toggle-detail }, title='詳細')
					i.fa.fa-caret-down(if={ !is-detail-opened })
					i.fa.fa-caret-up(if={ is-detail-opened })
	div.detail(if={ is-detail-opened })
		mk-post-status-graph(width='462', height='130', post={ p })

style.
	display block
	margin 0
	padding 0
	background #fff

	&:focus
		z-index 1

		&:after
			content ""
			pointer-events none
			position absolute
			top 2px
			right 2px
			bottom 2px
			left 2px
			border 2px solid rgba($theme-color, 0.3)
			border-radius 4px

	> .repost
		color #9dbb00
		background linear-gradient(to bottom, #edfde2 0%, #fff 100%)

		> p
			margin 0
			padding 16px 32px
			line-height 28px

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
			top 16px
			right 32px
			font-size 0.9em
			line-height 28px

		& + article
			padding-top 8px

	> .reply-to
		padding 0 16px
		background rgba(0, 0, 0, 0.0125)

		> mk-post-preview
			background transparent

	> article
		padding 28px 32px 18px 32px

		&:after
			content ""
			display block
			clear both

		&:hover
			> .main > footer > button
				color #888

		> .avatar-anchor
			display block
			float left
			margin 0 16px 0 0

			> .avatar
				display block
				width 58px
				height 58px
				margin 0
				border-radius 8px
				vertical-align bottom

		> .main
			float left
			width calc(100% - 74px)

			> header
				margin-bottom 4px
				white-space nowrap
				line-height 24px

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
					padding 0 8px
					line-height 32px
					font-size 1em
					color #ddd
					background transparent
					border none
					cursor pointer

					&:hover
						color #666

					> .count
						display inline
						margin 0 0 0 8px
						color #999

					&.liked
						color $theme-color

					&:last-child
						position absolute
						right 0
						margin 0

	> .detail
		padding-top 4px
		background rgba(0, 0, 0, 0.0125)

style(theme='dark').
	background #0D0D0D

	> article

		&:hover
			> .main > footer > button
				color #eee

		> .main
			> header
				> .left
					> .name
						color #9e9c98

					> .username
						color #41403f

				> .right
					> .time
						color #4e4d4b

			> .body
				> .text
					color #9e9c98

			> footer
				> button
					color #9e9c98

					&:hover
						color #fff

					> .count
						color #eee

script.
	@mixin \api
	@mixin \text
	@mixin \date-stringify
	@mixin \user-preview
	@mixin \NotImplementedException

	@post = @opts.post
	@is-repost = @post.repost? and !@post.text?
	@p = if @is-repost then @post.repost else @post

	@title = @date-stringify @p.created_at

	@url = CONFIG.url + '/' + @p.user.username + '/' + @p.id
	@is-detail-opened = false

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
		form = document.body.append-child document.create-element \mk-post-form-window
		riot.mount form, do
			reply: @p

	@repost = ~>
		form = document.body.append-child document.create-element \mk-repost-form-window
		riot.mount form, do
			post: @p

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

	@toggle-detail = ~>
		@is-detail-opened = !@is-detail-opened
		@update!

	@on-key-down = (e) ~>
		should-be-cancel = true
		switch
		| e.which == 38 or e.which == 74 or (e.which == 9 and e.shift-key) => # ↑, j or Shift+Tab
			focus @root, (e) -> e.previous-element-sibling
		| e.which == 40 or e.which == 75 or e.which == 9 => # ↓, k or Tab
			focus @root, (e) -> e.next-element-sibling
		| e.which == 69 => # e
			@repost!
		| e.which == 70 or e.which == 76 => # f or l
			@like!
		| e.which == 82 => # r
			@reply!
		| _ =>
			should-be-cancel = false

		if should-be-cancel
			e.prevent-default!

	function focus(el, fn)
		target = fn el
		if target?
			if target.has-attribute \tabindex
				target.focus!
			else
				focus target, fn
