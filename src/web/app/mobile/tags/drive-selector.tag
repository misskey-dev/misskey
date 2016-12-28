mk-drive-selector
	div.body
		header
			h1
				| ファイルを選択
				span.count(if={ files.length > 0 }) ({ files.length })
			button.close(onclick={ cancel }): i.fa.fa-times
			button.ok(onclick={ ok }): i.fa.fa-check
		mk-drive@browser(select={ true }, multiple={ opts.multiple })

style.
	display block

	> .body
		position fixed
		z-index 2048
		top 0
		left 0
		right 0
		margin 0 auto
		width 100%
		max-width 500px
		height 100%
		overflow hidden
		background #fff
		box-shadow 0 0 16px rgba(#000, 0.3)

		> header
			border-bottom solid 1px #eee

			> h1
				margin 0
				padding 0
				text-align center
				line-height 42px
				font-size 1em
				font-weight normal

				> .count
					margin-left 4px
					opacity 0.5

			> .close
				position absolute
				top 0
				left 0
				line-height 42px
				width 42px

			> .ok
				position absolute
				top 0
				right 0
				line-height 42px
				width 42px

		> mk-drive
			height calc(100% - 42px)
			overflow scroll

script.
	@files = []

	@on \mount ~>
		@refs.browser.on \change-selected (files) ~>
			@files = files
			@update!

	@cancel = ~>
		@trigger \canceled
		@unmount!

	@ok = ~>
		@trigger \selected @files
		@unmount!
