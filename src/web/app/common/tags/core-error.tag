mk-core-error
	//i: i.fa.fa-times-circle
	img(src='/_/resources/error.jpg', alt='')
	h1: mk-ripple-string サーバーに接続できません
	p.text
		| インターネット回線に問題があるか、サーバーがダウンまたはメンテナンスしている可能性があります。しばらくしてから
		a(onclick={ retry }) 再度お試し
		| ください。
	p.thanks いつもMisskeyをご利用いただきありがとうございます。

style.
	position fixed
	z-index 16385
	top 0
	left 0
	width 100%
	height 100%
	text-align center
	background #f8f8f8

	> i
		display block
		margin-top 64px
		font-size 5em
		color #6998a0

	> img
		display block
		height 200px
		margin 64px auto 0 auto
		pointer-events none
		-ms-user-select none
		-moz-user-select none
		-webkit-user-select none
		user-select none

	> h1
		display block
		margin 32px auto 16px auto
		font-size 1.5em
		color #555

	> .text
		display block
		margin 0 auto
		max-width 600px
		font-size 1em
		color #666

	> .thanks
		display block
		margin 32px auto 0 auto
		padding 32px 0 32px 0
		max-width 600px
		font-size 0.9em
		font-style oblique
		color #aaa
		border-top solid 1px #eee

script.
	@retry = ~>
		@unmount!
		@opts.retry!
