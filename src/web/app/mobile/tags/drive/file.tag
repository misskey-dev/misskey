mk-drive-file(onclick={ onclick }, data-is-selected={ is-selected })
	div.container
		div.thumbnail(style={ 'background-image: url(' + file.url + '?thumbnail&size=128)' })
		div.body
			p.name { file.name }
			//
				if file.tags.length > 0
					ul.tags
						each tag in file.tags
							li.tag(style={background: tag.color, color: contrast(tag.color)})= tag.name
			footer
				p.type
					mk-file-type-icon(file={ file })
					| { file.type }
				p.separator
				p.data-size { bytes-to-size(file.datasize) }
				p.separator
				p.created-at
					i.fa.fa-clock-o
					mk-time(time={ file.created_at })

style.
	display block

	&, *
		user-select none

	*
		pointer-events none

	> .container
		max-width 500px
		margin 0 auto
		padding 16px

		&:after
			content ""
			display block
			clear both

		> .thumbnail
			display block
			float left
			width 64px
			height 64px
			background-size cover
			background-position center center

		> .body
			display block
			float left
			width calc(100% - 74px)
			margin-left 10px

			> .name
				display block
				margin 0
				padding 0
				font-size 0.9em
				font-weight bold
				color #555
				text-overflow ellipsis
				word-wrap break-word

			> .tags
				display block
				margin 4px 0 0 0
				padding 0
				list-style none
				font-size 0.5em

				> .tag
					display inline-block
					margin 0 5px 0 0
					padding 1px 5px
					border-radius 2px

			> footer
				display block
				margin 4px 0 0 0
				font-size 0.7em

				> .separator
					display inline
					margin 0
					padding 0 4px
					color #CDCDCD

				> .type
					display inline
					margin 0
					padding 0
					color #9D9D9D

					> mk-file-type-icon
						margin-right 4px

				> .data-size
					display inline
					margin 0
					padding 0
					color #9D9D9D

				> .created-at
					display inline
					margin 0
					padding 0
					color #BDBDBD

					> i
						margin-right 2px

	&[data-is-selected]
		background $theme-color

		&, *
			color #fff !important

script.
	@mixin \bytes-to-size

	@browser = @parent
	@file = @opts.file
	@is-selected = @browser.selected-files.some (f) ~> f.id == @file.id

	@browser.on \change-selected (selects) ~>
		@is-selected = selects.some (f) ~> f.id == @file.id

	@onclick = ~>
		@browser.choose-file @file
