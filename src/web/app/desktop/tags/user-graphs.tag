mk-user-graphs
	section
		h1 投稿
		mk-user-posts-graph(user={ opts.user })

	section
		h1 フォロー/フォロワー
		mk-user-friends-graph(user={ opts.user })

	section
		h1 いいね
		mk-user-likes-graph(user={ opts.user })

style.
	display block

	> section
		margin 16px 0
		background #fff
		border solid 1px rgba(0, 0, 0, 0.1)
		border-radius 4px

		> h1
			margin 0 0 8px 0
			padding 0 16px
			line-height 40px
			font-size 1em
			color #666
			border-bottom solid 1px #eee

		> *:not(h1)
			margin 0 auto 16px auto

script.
	@on \mount ~>
		@trigger \loaded
