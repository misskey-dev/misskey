mk-ui-header-post-button
	button(onclick={ post }, title='新規投稿')
		i.fa.fa-pencil-square-o

style.
	display inline-block
	padding 8px
	height 100%
	vertical-align top

	> button
		display inline-block
		margin 0
		padding 0 10px
		height 100%
		font-size 1.2em
		font-weight normal
		text-decoration none
		color $theme-color-foreground
		background $theme-color !important
		outline none
		border none
		border-radius 2px
		transition background 0.1s ease
		cursor pointer

		*
			pointer-events none

		&:hover
			background lighten($theme-color, 10%) !important

		&:active
			background darken($theme-color, 10%) !important
			transition background 0s ease

script.
	@post = (e) ~>
		@parent.parent.open-post-form!
