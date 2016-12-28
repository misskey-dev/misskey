mk-settings
	div.nav
		p(class={ active: page == 'account' }, onmousedown={ set-page.bind(null, 'account') })
			i.fa.fa-fw.fa-user
			| アカウント
		p(class={ active: page == 'web' }, onmousedown={ set-page.bind(null, 'web') })
			i.fa.fa-fw.fa-desktop
			| Web
		p(class={ active: page == 'notification' }, onmousedown={ set-page.bind(null, 'notification') })
			i.fa.fa-fw.fa-bell-o
			| 通知
		p(class={ active: page == 'drive' }, onmousedown={ set-page.bind(null, 'drive') })
			i.fa.fa-fw.fa-cloud
			| ドライブ
		p(class={ active: page == 'apps' }, onmousedown={ set-page.bind(null, 'apps') })
			i.fa.fa-fw.fa-puzzle-piece
			| アプリ
		p(class={ active: page == 'signin' }, onmousedown={ set-page.bind(null, 'signin') })
			i.fa.fa-fw.fa-sign-in
			| ログイン履歴
		p(class={ active: page == 'password' }, onmousedown={ set-page.bind(null, 'password') })
			i.fa.fa-fw.fa-unlock-alt
			| パスワード
		p(class={ active: page == 'api' }, onmousedown={ set-page.bind(null, 'api') })
			i.fa.fa-fw.fa-key
			| API

	div.pages
		section.account(show={ page == 'account' })
			h1 アカウント
			label.avatar
				p アバター
				img.avatar(src={ I.avatar_url + '?thumbnail&size=64' }, alt='avatar')
				button.style-normal(onclick={ avatar }) 画像を選択
			label
				p 名前
				input@account-name(type='text', value={ I.name })
			label
				p 場所
				input@account-location(type='text', value={ I.location })
			label
				p 自己紹介
				textarea@account-bio { I.bio }
			button.style-primary(onclick={ update-account }) 保存

		section.web(show={ page == 'web' })
			h1 デザイン
			label
				p 壁紙
				button.style-normal(onclick={ wallpaper }) 画像を選択
		section.web(show={ page == 'web' })
			h1 その他
			label.checkbox
				input(type='checkbox', checked={ I.data.cache }, onclick={ update-cache })
				p 読み込みを高速化する
				p API通信時に新鮮なユーザー情報をキャッシュすることでフェッチのオーバーヘッドを無くします。(実験的)
			label.checkbox
				input(type='checkbox', checked={ I.data.debug }, onclick={ update-debug })
				p 開発者モード
				p デバッグ等の開発者モードを有効にします。

		section.signin(show={ page == 'signin' })
			h1 ログイン履歴
			mk-signin-history

		section.api(show={ page == 'api' })
			h1 API
			p
				| Token:
				code { I.token }
			p APIを利用するには、上記のトークンを「i」というキーでパラメータに付加してリクエストします。
			p アカウントを乗っ取られてしまう可能性があるため、このトークンは第三者に教えないでください(アプリなどにも入力しないでください)。
			p
				| 万が一このトークンが漏れたりその可能性がある場合は
				button.regenerate(onclick={ regenerate-token }) トークンを再生成
				| できます。(副作用として、ログインしているすべてのデバイスでログアウトが発生します)

style.
	display block

	input:not([type])
	input[type='text']
	input[type='password']
	input[type='email']
	textarea
		padding 8px
		width 100%
		font-size 16px
		color #55595c
		border solid 1px #dadada
		border-radius 4px

		&:hover
			border-color #aeaeae

		&:focus
			border-color #aeaeae

	> .nav
		position absolute
		top 0
		left 0
		width 200px
		height 100%
		padding 16px 0 0 0
		border-right solid 1px #ddd

		> p
			display block
			padding 10px 16px
			margin 0
			color #666
			cursor pointer

			-ms-user-select none
			-moz-user-select none
			-webkit-user-select none
			user-select none

			transition margin-left 0.2s ease

			> i
				margin-right 4px

			&:hover
				color #555

			&.active
				margin-left 8px
				color $theme-color !important

	> .pages
		position absolute
		top 0
		left 200px
		width calc(100% - 200px)

		> section
			padding 32px

			//	& + section
			//		margin-top 16px

			h1
				display block
				margin 0
				padding 0 0 8px 0
				font-size 1em
				color #555
				border-bottom solid 1px #eee

			label
				display block
				margin 16px 0

				&:after
					content ""
					display block
					clear both

				> p
					margin 0 0 8px 0
					font-weight bold
					color #373a3c

				&.checkbox
					> input
						position absolute
						top 0
						left 0

						&:checked + p
							color $theme-color

					> p
						width calc(100% - 32px)
						margin 0 0 0 32px
						font-weight bold

						&:last-child
							font-weight normal
							color #999

			&.account
				> .general
					> .avatar
						> img
							display block
							float left
							width 64px
							height 64px
							border-radius 4px

						> button
							float left
							margin-left 8px

			&.api
				code
					padding 4px
					background #eee

				.regenerate
					display inline
					color $theme-color

					&:hover
						text-decoration underline

script.
	@mixin \i
	@mixin \api
	@mixin \dialog
	@mixin \update-avatar
	@mixin \update-wallpaper

	@page = \account

	@set-page = (page) ~>
		@page = page

	@avatar = ~>
		@update-avatar @I, (i) ~>
			@update-i i

	@wallpaper = ~>
		@update-wallpaper @I, (i) ~>
			@update-i i

	@update-account = ~>
		@api \i/update do
			name: @refs.account-name.value
			location: @refs.account-location.value
			bio: @refs.account-bio.value
		.then (i) ~>
			@update-i i
			alert \ok
		.catch (err) ~>
			console.error err

	@update-cache = ~>
		@I.data.cache = !@I.data.cache
		@api \i/appdata/set do
			data: JSON.stringify do
				cache: @I.data.cache
		.then ~>
			@update-i!

	@update-debug = ~>
		@I.data.debug = !@I.data.debug
		@api \i/appdata/set do
			data: JSON.stringify do
				debug: @I.data.debug
		.then ~>
			@update-i!
