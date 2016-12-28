mk-new-app-page
	main
		header
			h1 新しいアプリを作成
			p MisskeyのAPIを利用したアプリケーションを作成できます。
		mk-new-app-form

style.
	display block
	padding 64px 0

	> main
		width 100%
		max-width 700px
		margin 0 auto

		> header
			margin 0 0 16px 0
			padding 0 0 16px 0
			border-bottom solid 1px #282827

			> h1
				margin 0 0 12px 0
				padding 0
				line-height 32px
				font-size 32px
				font-weight normal
				color #000

			> p
				margin 0
				line-height 16px
				color #9a9894
