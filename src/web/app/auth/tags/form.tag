mk-form
	header
		h1
			i { app.name }
			| があなたの
			b アカウント
			| に
			b アクセス
			| することを
			b 許可
			| しますか？
		img(src={ app.icon_url + '?thumbnail&size=64' })
	div.app
		section
			h2 { app.name }
			p.nid { app.name_id }
			p.description { app.description }
		section
			h2 このアプリは次の権限を要求しています:
			ul
				virtual(each={ p in app.permission })
					li(if={ p == 'account-read' }) アカウントの情報を見る。
					li(if={ p == 'account-write' }) アカウントの情報を操作する。
					li(if={ p == 'post-write' }) 投稿する。
					li(if={ p == 'like-write' }) いいねしたりいいね解除する。
					li(if={ p == 'following-write' }) フォローしたりフォロー解除する。
					li(if={ p == 'drive-read' }) ドライブを見る。
					li(if={ p == 'drive-write' }) ドライブを操作する。
					li(if={ p == 'notification-read' }) 通知を見る。
					li(if={ p == 'notification-write' }) 通知を操作する。

	div.action
		button(onclick={ cancel }) キャンセル
		button(onclick={ accept }) アクセスを許可

style.
	display block

	> header
		> h1
			margin 0
			padding 32px 32px 20px 32px
			font-size 24px
			font-weight normal
			color #777

			i
				color #77aeca

				&:before
					content '「'

				&:after
					content '」'

			b
				color #666

		> img
			display block
			z-index 1
			width 84px
			height 84px
			margin 0 auto -38px auto
			border solid 5px #fff
			border-radius 100%
			box-shadow 0 2px 2px rgba(0, 0, 0, 0.1)

	> .app
		padding 44px 16px 0 16px
		color #555
		background #eee
		box-shadow 0 2px 2px rgba(0, 0, 0, 0.1) inset

		&:after
			content ''
			display block
			clear both

		> section
			float left
			width 50%
			padding 8px
			text-align left

			> h2
				margin 0
				font-size 16px
				color #777

	> .action
		padding 16px

		> button
			margin 0 8px

	@media (max-width 600px)
		> header
			> img
				box-shadow none

		> .app
			box-shadow none

	@media (max-width 500px)
		> header
			> h1
				font-size 16px

script.
	@mixin \api

	@session = @opts.session
	@app = @session.app

	@cancel = ~>
		@api \auth/deny do
			token: @session.token
		.then ~>
			@trigger \denied

	@accept = ~>
		@api \auth/accept do
			token: @session.token
		.then ~>
			@trigger \accepted
