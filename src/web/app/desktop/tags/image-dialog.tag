mk-image-dialog
	div.bg@bg(onclick={ close })
	img@img(src={ image.url }, alt={ image.name }, title={ image.name }, onclick={ close })

style.
	display block
	position fixed
	z-index 2048
	top 0
	left 0
	width 100%
	height 100%
	opacity 0

	> .bg
		display block
		position fixed
		z-index 1
		top 0
		left 0
		width 100%
		height 100%
		background rgba(0, 0, 0, 0.7)

	> img
		position fixed
		z-index 2
		top 0
		right 0
		bottom 0
		left 0
		max-width 100%
		max-height 100%
		margin auto
		cursor zoom-out

script.
	@image = @opts.image

	@on \mount ~>
		Velocity @root, {
			opacity: 1
		} {
			duration: 100ms
			easing: \linear
		}

		#Velocity @img, {
		#	scale: 1
		#	opacity: 1
		#} {
		#	duration: 200ms
		#	easing: \ease-out
		#}

	@close = ~>
		Velocity @root, {
			opacity: 0
		} {
			duration: 100ms
			easing: \linear
			complete: ~> @unmount!
		}

		#Velocity @img, {
		#	scale: 0.9
		#	opacity: 0
		#} {
		#	duration: 200ms
		#	easing: \ease-in
		#	complete: ~>
		#		@unmount!
		#}
