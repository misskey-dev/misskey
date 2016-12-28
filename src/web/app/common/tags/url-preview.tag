mk-url-preview
	a(href={ url }, target='_blank', title={ url }, if={ !loading })
		div.thumbnail(if={ thumbnail }, style={ 'background-image: url(' + thumbnail + ')' })
		article
			header: h1 { title }
			p { description }
			footer
				img.icon(if={ icon }, src={ icon })
				p { sitename }

style.
	display block
	font-size 16px

	> a
		display block
		border solid 1px #eee
		border-radius 4px
		overflow hidden

		&:hover
			text-decoration none
			border-color #ddd

			> article > header > h1
				text-decoration underline

		> .thumbnail
			position absolute
			width 100px
			height 100%
			background-position center
			background-size cover

			& + article
				left 100px
				width calc(100% - 100px)

		> article
			padding 16px

			> header
				margin-bottom 8px

				> h1
					margin 0
					font-size 1em
					color #555

			> p
				margin 0
				color #777
				font-size 0.8em

			> footer
				margin-top 8px

				> img
					display inline-block
					width 16px
					heigth 16px
					margin-right 4px
					vertical-align bottom

				> p
					display inline-block
					margin 0
					color #666
					font-size 0.8em
					line-height 16px

	@media (max-width 500px)
		font-size 8px

		> a
			border none

			> .thumbnail
				width 70px

				& + article
					left 70px
					width calc(100% - 70px)

			> article
				padding 8px

script.
	@mixin \api

	@url = @opts.url
	@loading = true

	@on \mount ~>
		fetch CONFIG.url + '/api:url?url=' + @url
		.then (res) ~>
			info <~ res.json!.then
			@title = info.title
			@description = info.description
			@thumbnail = info.thumbnail
			@icon = info.icon
			@sitename = info.sitename

			@loading = false
			@update!
