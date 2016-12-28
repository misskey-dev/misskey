mk-repost-form
	mk-post-preview(post={ opts.post })
	div.form(if={ quote })
		textarea@text(disabled={ wait }, placeholder='この投稿を引用...')
	footer
		a.quote(if={ !quote }, onclick={ onquote }) 引用する...
		button.cancel(onclick={ cancel }) キャンセル
		button.ok(onclick={ ok }) Repost

style.

	> mk-post-preview
		margin 16px 22px

	> .form
		[ref='text']
			display block
			padding 12px
			margin 0
			width 100%
			max-width 100%
			min-width 100%
			min-height calc(1em + 12px + 12px)
			font-size 1em
			color #333
			background #fff
			outline none
			border solid 1px rgba($theme-color, 0.1)
			border-radius 4px
			transition border-color .3s ease

			&:hover
				border-color rgba($theme-color, 0.2)
				transition border-color .1s ease

			&:focus
				color $theme-color
				border-color rgba($theme-color, 0.5)
				transition border-color 0s ease

			&:disabled
				opacity 0.5

			&::-webkit-input-placeholder
				color rgba($theme-color, 0.3)

	> div
		padding 16px

	> footer
		height 72px
		background lighten($theme-color, 95%)

		> .quote
			position absolute
			bottom 16px
			left 28px
			line-height 40px

		button
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

		> .cancel
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

		> .ok
			right 16px
			font-weight bold
			color $theme-color-foreground
			background linear-gradient(to bottom, lighten($theme-color, 25%) 0%, lighten($theme-color, 10%) 100%)
			border solid 1px lighten($theme-color, 15%)

			&:hover
				background linear-gradient(to bottom, lighten($theme-color, 8%) 0%, darken($theme-color, 8%) 100%)
				border-color $theme-color

			&:active
				background $theme-color
				border-color $theme-color

script.
	@mixin \api
	@mixin \notify

	@wait = false
	@quote = false

	@cancel = ~>
		@trigger \cancel

	@ok = ~>
		@wait = true
		@api \posts/create do
			repost_id: @opts.post.id
			text: if @quote then @refs.text.value else undefined
		.then (data) ~>
			@trigger \posted
			@notify 'Repostしました！'
		.catch (err) ~>
			console.error err
			@notify 'Repostできませんでした'
		.then ~>
			@wait = false
			@update!

	@onquote = ~>
		@quote = true
