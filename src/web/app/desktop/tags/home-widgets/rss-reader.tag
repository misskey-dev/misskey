mk-rss-reader-home-widget
	p.title
		i.fa.fa-rss-square
		| RSS
	button(onclick={ settings }, title='設定'): i.fa.fa-cog
	div.feed(if={ !initializing })
		virtual(each={ item in items })
			a(href={ item.link }, target='_blank') { item.title }
	p.initializing(if={ initializing })
		i.fa.fa-spinner.fa-pulse.fa-fw
		| 読み込んでいます
		mk-ellipsis

style.
	display block
	background #fff

	> .title
		margin 0
		padding 0 16px
		line-height 42px
		font-size 0.9em
		font-weight bold
		color #888
		box-shadow 0 1px rgba(0, 0, 0, 0.07)

		> i
			margin-right 4px

	> button
		position absolute
		top 0
		right 0
		padding 0
		width 42px
		font-size 0.9em
		line-height 42px
		color #ccc

		&:hover
			color #aaa

		&:active
			color #999

	> .feed
		padding 12px 16px
		font-size 0.9em

		> a
			display block
			padding 4px 0
			color #666
			border-bottom dashed 1px #eee

			&:last-child
				border-bottom none

	> .initializing
		margin 0
		padding 16px
		text-align center
		color #aaa

		> i
			margin-right 4px

script.
	@mixin \api
	@mixin \NotImplementedException

	@url = 'http://news.yahoo.co.jp/pickup/rss.xml'
	@items = []
	@initializing = true

	@on \mount ~>
		@fetch!
		@clock = set-interval @fetch, 60000ms

	@on \unmount ~>
		clear-interval @clock

	@fetch = ~>
		@api CONFIG.url + '/api:rss' do
			url: @url
		.then (feed) ~>
			@items = feed.rss.channel.item
			@initializing = false
			@update!
		.catch (err) ->
			console.error err

	@settings = ~>
		@NotImplementedException!
