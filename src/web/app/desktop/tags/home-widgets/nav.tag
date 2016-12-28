mk-nav-home-widget
	a(href={ CONFIG.urls.about }) Misskeyについて
	i ・
	a(href={ CONFIG.urls.about + '/status' }) ステータス
	i ・
	a(href='https://github.com/syuilo/misskey') リポジトリ
	i ・
	a(href={ CONFIG.urls.dev }) 開発者
	i ・
	a(href='https://twitter.com/misskey_xyz', target='_blank') Follow us on <i class="fa fa-twitter"></i>

style.
	display block
	padding 16px
	font-size 12px
	color #aaa
	background #fff

	a
		color #999

	i
		color #ccc
