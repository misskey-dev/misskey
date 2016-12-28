mk-index
	main(if={ SIGNIN })
		p.fetching(if={ fetching })
			| 読み込み中
			mk-ellipsis
		mk-form@form(if={ state == null && !fetching }, session={ session })
		div.denied(if={ state == 'denied' })
			h1 アプリケーションの連携をキャンセルしました。
			p このアプリがあなたのアカウントにアクセスすることはありません。
		div.accepted(if={ state == 'accepted' })
			h1 { session.app.is_authorized ? 'このアプリは既に連携済みです' : 'アプリケーションの連携を許可しました'}
			p(if={ session.app.callback_url })
				| アプリケーションに戻っています
				mk-ellipsis
			p(if={ !session.app.callback_url }) アプリケーションに戻って、やっていってください。
		div.error(if={ state == 'fetch-session-error' })
			p セッションが存在しません。
	main.signin(if={ !SIGNIN })
		h1 サインインしてください
		mk-signin
	footer
		img(src='/_/resources/auth/logo.svg', alt='Misskey')

style.
	display block

	> main
		width 100%
		max-width 500px
		margin 0 auto
		text-align center
		background #fff
		box-shadow 0px 4px 16px rgba(0, 0, 0, 0.2)

		> .fetching
			margin 0
			padding 32px
			color #555

		> div
			padding 64px

			> h1
				margin 0 0 8px 0
				padding 0
				font-size 20px
				font-weight normal

			> p
				margin 0
				color #555

			&.denied > h1
				color #e65050

			&.accepted > h1
				color #50bbe6

		&.signin
			padding 32px 32px 16px 32px

			> h1
				margin 0 0 22px 0
				padding 0
				font-size 20px
				font-weight normal
				color #555

		@media (max-width 600px)
			max-width none
			box-shadow none

		@media (max-width 500px)
			> div
				> h1
					font-size 16px

	> footer
		> img
			display block
			width 64px
			height 64px
			margin 0 auto

script.
	@mixin \i
	@mixin \api

	@state = null
	@fetching = true

	@token = window.location.href.split \/ .pop!

	@on \mount ~>
		if not @SIGNIN then return

		# Fetch session
		@api \auth/session/show do
			token: @token
		.then (session) ~>
			@session = session
			@fetching = false

			# 既に連携していた場合
			if @session.app.is_authorized
				@api \auth/accept do
					token: @session.token
				.then ~>
					@accepted!
			else
				@update!

				@refs.form.on \denied ~>
					@state = \denied
					@update!

				@refs.form.on \accepted @accepted

		.catch (error) ~>
			@fetching = false
			@state = \fetch-session-error
			@update!

	@accepted = ~>
		@state = \accepted
		@update!

		if @session.app.callback_url
			location.href = @session.app.callback_url + '?token=' + @session.token
