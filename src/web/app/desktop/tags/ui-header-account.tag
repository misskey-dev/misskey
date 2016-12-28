mk-ui-header-account
	button.header(data-active={ is-open.toString() }, onclick={ toggle })
		span.username
			| { I.username }
			i.fa.fa-angle-down(if={ !is-open })
			i.fa.fa-angle-up(if={ is-open })
		img.avatar(src={ I.avatar_url + '?thumbnail&size=64' }, alt='avatar')
	div.menu(if={ is-open })
		ul
			li: a(href={ '/' + I.username })
				i.fa.fa-user
				| プロフィール
				i.fa.fa-angle-right
			li(onclick={ drive }): p
				i.fa.fa-cloud
				| ドライブ
				i.fa.fa-angle-right
			li: a(href='/i>mentions')
				i.fa.fa-at
				| あなた宛て
				i.fa.fa-angle-right
		ul
			li(onclick={ settings }): p
				i.fa.fa-cog
				| 設定
				i.fa.fa-angle-right
		ul
			li(onclick={ signout }): p
				i(class='fa fa-power-off')
				| サインアウト
				i.fa.fa-angle-right

style.
	display block
	float left

	> .header
		display block
		margin 0
		padding 0
		color #9eaba8
		border none
		background transparent
		cursor pointer

		*
			pointer-events none

		&:hover
			color darken(#9eaba8, 20%)

		&:active
			color darken(#9eaba8, 30%)

		&[data-active='true']
			color darken(#9eaba8, 20%)

			> .avatar
				$saturate = 150%
				filter saturate($saturate)
				-webkit-filter saturate($saturate)
				-moz-filter saturate($saturate)
				-ms-filter saturate($saturate)

		> .username
			display block
			float left
			margin 0 12px 0 16px
			max-width 16em
			line-height 48px
			font-weight bold
			font-family Meiryo, sans-serif
			text-decoration none

			i
				margin-left 8px

		> .avatar
			display block
			float left
			min-width 32px
			max-width 32px
			min-height 32px
			max-height 32px
			margin 8px 8px 8px 0
			border-radius 4px
			transition filter 100ms ease

	> .menu
		display block
		position absolute
		top 56px
		right -2px
		width 230px
		font-size 0.8em
		background #fff
		border-radius 4px
		box-shadow 0 1px 4px rgba(0, 0, 0, 0.25)

		&:before
			content ""
			pointer-events none
			display block
			position absolute
			top -28px
			right 12px
			border-top solid 14px transparent
			border-right solid 14px transparent
			border-bottom solid 14px rgba(0, 0, 0, 0.1)
			border-left solid 14px transparent

		&:after
			content ""
			pointer-events none
			display block
			position absolute
			top -27px
			right 12px
			border-top solid 14px transparent
			border-right solid 14px transparent
			border-bottom solid 14px #fff
			border-left solid 14px transparent

		ul
			display block
			margin 10px 0
			padding 0
			list-style none

			& + ul
				padding-top 10px
				border-top solid 1px #eee

			> li
				display block
				margin 0
				padding 0

				> a
				> p
					display block
					z-index 1
					padding 0 28px
					margin 0
					line-height 40px
					color #868C8C
					cursor pointer

					*
						pointer-events none

					> i:first-of-type
						margin-right 6px

					> i:last-of-type
						display block
						position absolute
						top 0
						right 8px
						z-index 1
						padding 0 20px
						font-size 1.2em
						line-height 40px

					&:hover, &:active
						text-decoration none
						background $theme-color
						color $theme-color-foreground

script.
	@mixin \i
	@mixin \signout

	@is-open = false

	@on \before-unmount ~>
		@close!

	@toggle = ~>
		if @is-open
			@close!
		else
			@open!

	@open = ~>
		@is-open = true
		@update!
		all = document.query-selector-all 'body *'
		Array.prototype.for-each.call all, (el) ~>
			el.add-event-listener \mousedown @mousedown

	@close = ~>
		@is-open = false
		@update!
		all = document.query-selector-all 'body *'
		Array.prototype.for-each.call all, (el) ~>
			el.remove-event-listener \mousedown @mousedown

	@mousedown = (e) ~>
		e.prevent-default!
		if (!contains @root, e.target) and (@root != e.target)
			@close!
		return false

	@drive = ~>
		@close!
		riot.mount document.body.append-child document.create-element \mk-drive-browser-window

	@settings = ~>
		@close!
		riot.mount document.body.append-child document.create-element \mk-settings-window

	function contains(parent, child)
		node = child.parent-node
		while node?
			if node == parent
				return true
			node = node.parent-node
		return false
