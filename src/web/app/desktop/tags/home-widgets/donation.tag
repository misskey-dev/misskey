mk-donation-home-widget
	article
		h1
			i.fa.fa-heart
			| 寄付のお願い
		p
			| Misskeyの運営にはドメイン、サーバー等のコストが掛かります。
			| Misskeyは広告を掲載したりしないため、 収入を皆様からの寄付に頼っています。
			| もしご興味があれば、
			a(href='/syuilo', data-user-preview='@syuilo') @syuilo
			| までご連絡ください。ご協力ありがとうございます。

style.
	display block
	background #fff
	border-color #ead8bb !important

	> article
		padding 20px

		> h1
			margin 0 0 5px 0
			font-size 1em
			color #888

			> i
				margin-right 0.25em

		> p
			display block
			z-index 1
			margin 0
			font-size 0.8em
			color #999

script.
	@mixin \user-preview
