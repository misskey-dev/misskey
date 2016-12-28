mk-ui-nav
	div.body: div.content
		a.me(if={ SIGNIN }, href={ CONFIG.url + '/' + I.username })
			img.avatar(src={ I.avatar_url + '?thumbnail&size=128' }, alt='avatar')
			p.name { I.name }
		div.links
			ul
				li.post: a(href='/i/post')
					i.icon.fa.fa-pencil-square-o
					| 新規投稿
					i.angle.fa.fa-angle-right
			ul
				li.home: a(href='/')
					i.icon.fa.fa-home
					| ホーム
					i.angle.fa.fa-angle-right
				li.mentions: a(href='/i/mentions')
					i.icon.fa.fa-at
					| あなた宛て
					i.angle.fa.fa-angle-right
				li.notifications: a(href='/i/notifications')
					i.icon.fa.fa-bell-o
					| 通知
					i.angle.fa.fa-angle-right
				li.messaging: a
					i.icon.fa.fa-comments-o
					| メッセージ
					i.angle.fa.fa-angle-right
			ul
				li.settings: a(onclick={ search })
					i.icon.fa.fa-search
					| 検索
					i.angle.fa.fa-angle-right
			ul
				li.settings: a(href='/i/drive')
					i.icon.fa.fa-cloud
					| ドライブ
					i.angle.fa.fa-angle-right
				li.settings: a(href='/i/upload')
					i.icon.fa.fa-upload
					| アップロード
					i.angle.fa.fa-angle-right
			ul
				li.settings: a(href='/i/settings')
					i.icon.fa.fa-cog
					| 設定
					i.angle.fa.fa-angle-right
		p.about
			a Misskeyについて

style.
	display block
	position fixed
	top 0
	left 0
	z-index -1
	width 240px
	color #fff
	background #313538
	visibility hidden

	.body
		height 100%
		overflow hidden

	.content
		min-height 100%

	.me
		display block
		margin 0
		padding 16px

		.avatar
			display inline
			max-width 64px
			border-radius 32px
			vertical-align middle

		.name
			display block
			margin 0 16px
			position absolute
			top 0
			left 80px
			padding 0
			width calc(100% - 112px)
			color #fff
			line-height 96px
			overflow hidden
			text-overflow ellipsis
			white-space nowrap

	ul
		display block
		margin 16px 0
		padding 0
		list-style none

		&:first-child
			margin-top 0

		li
			display block
			font-size 1em
			line-height 1em
			border-top solid 1px rgba(0, 0, 0, 0.2)
			background #353A3E
			background-clip content-box

			&:last-child
				border-bottom solid 1px rgba(0, 0, 0, 0.2)

			a
				display block
				padding 0 20px
				line-height 3rem
				line-height calc(1rem + 30px)
				color #eee
				text-decoration none

				> .icon
					margin-right 0.5em

				> .angle
					position absolute
					top 0
					right 0
					padding 0 20px
					font-size 1.2em
					line-height calc(1rem + 30px)
					color #ccc

				> .unread-count
					position absolute
					height calc(0.9em + 10px)
					line-height calc(0.9em + 10px)
					top 0
					bottom 0
					right 38px
					margin auto 0
					padding 0px 8px
					min-width 2em
					font-size 0.9em
					text-align center
					color #fff
					background rgba(255, 255, 255, 0.1)
					border-radius 1em

	.about
		margin 1em 1em 2em 1em
		text-align center
		font-size 0.6em
		opacity 0.3

		a
			color #fff

script.
	@mixin \i
	@mixin \page

	@on \mount ~>
		@opts.ready!

	@search = ~>
		query = window.prompt \検索
		if query? and query != ''
			@page '/search:' + query
