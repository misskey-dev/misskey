mk-select-file-from-drive-window
	mk-window@window(is-modal={ true }, width={ '800px' }, height={ '500px' })
		<yield to="header">
		mk-raw(content={ parent.title })
		span.count(if={ parent.multiple && parent.file.length > 0 }) ({ parent.file.length }ファイル選択中)
		</yield>
		<yield to="content">
		mk-drive-browser@browser(multiple={ parent.multiple })
		div
			button.upload(title='PCからドライブにファイルをアップロード', onclick={ parent.upload }): i.fa.fa-upload
			button.cancel(onclick={ parent.close }) キャンセル
			button.ok(disabled={ parent.multiple && parent.file.length == 0 }, onclick={ parent.ok }) 決定
		</yield>

style.
	> mk-window
		[data-yield='header']
			> mk-raw
				> i
					margin-right 4px

			.count
				margin-left 8px
				opacity 0.7

		[data-yield='content']
			> mk-drive-browser
				height calc(100% - 72px)

			> div
				height 72px
				background lighten($theme-color, 95%)

				.upload
					display inline-block
					position absolute
					top 8px
					left 16px
					cursor pointer
					padding 0
					margin 8px 4px 0 0
					width 40px
					height 40px
					font-size 1em
					color rgba($theme-color, 0.5)
					background transparent
					outline none
					border solid 1px transparent
					border-radius 4px

					&:hover
						background transparent
						border-color rgba($theme-color, 0.3)

					&:active
						color rgba($theme-color, 0.6)
						background transparent
						border-color rgba($theme-color, 0.5)
						box-shadow 0 2px 4px rgba(darken($theme-color, 50%), 0.15) inset

					&:focus
						&:after
							content ""
							pointer-events none
							position absolute
							top -5px
							right -5px
							bottom -5px
							left -5px
							border 2px solid rgba($theme-color, 0.3)
							border-radius 8px

				.ok
				.cancel
					display block
					position absolute
					bottom 16px
					cursor pointer
					padding 0
					margin 0
					width 120px
					height 40px
					font-size 1em
					outline none
					border-radius 4px

					&:focus
						&:after
							content ""
							pointer-events none
							position absolute
							top -5px
							right -5px
							bottom -5px
							left -5px
							border 2px solid rgba($theme-color, 0.3)
							border-radius 8px

					&:disabled
						opacity 0.7
						cursor default

				.ok
					right 16px
					color $theme-color-foreground
					background linear-gradient(to bottom, lighten($theme-color, 25%) 0%, lighten($theme-color, 10%) 100%)
					border solid 1px lighten($theme-color, 15%)

					&:not(:disabled)
						font-weight bold

					&:hover:not(:disabled)
						background linear-gradient(to bottom, lighten($theme-color, 8%) 0%, darken($theme-color, 8%) 100%)
						border-color $theme-color

					&:active:not(:disabled)
						background $theme-color
						border-color $theme-color

				.cancel
					right 148px
					color #888
					background linear-gradient(to bottom, #ffffff 0%, #f5f5f5 100%)
					border solid 1px #e2e2e2

					&:hover
						background linear-gradient(to bottom, #f9f9f9 0%, #ececec 100%)
						border-color #dcdcdc

					&:active
						background #ececec
						border-color #dcdcdc

script.
	@file = []

	@multiple = if @opts.multiple? then @opts.multiple else false
	@title = @opts.title || '<i class="fa fa-file-o"></i>ファイルを選択'

	@on \mount ~>
		@refs.window.refs.browser.on \selected (file) ~>
			@file = file
			@ok!

		@refs.window.refs.browser.on \change-selection (files) ~>
			@file = files
			@update!

		@refs.window.on \closed ~>
			@unmount!

	@close = ~>
		@refs.window.close!

	@upload = ~>
		@refs.window.refs.browser.select-local-file!

	@ok = ~>
		@trigger \selected @file
		@refs.window.close!
