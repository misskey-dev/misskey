<mk-images-viewer>
	<div class="image" ref="view" onmousemove={ mousemove } style={ 'background-image: url(' + image.url + '?thumbnail' } onclick={ click }><img src={ image.url + '?thumbnail&size=512' } alt={ image.name } title={ image.name }/></div>
	<style>
		:scope
			display block
			padding 8px
			overflow hidden
			box-shadow 0 0 4px rgba(0, 0, 0, 0.2)
			border-radius 4px

			> .image
				cursor zoom-in

				> img
					display block
					max-height 256px
					max-width 100%
					margin 0 auto

				&:hover
					> img
						visibility hidden

				&:not(:hover)
					background-image none !important

	</style>
	<script>
		this.images = this.opts.images
		this.image = @images.0

		this.mousemove = (e) => {
			rect = this.refs.view.get-bounding-client-rect!
			mouse-x = e.client-x - rect.left
			mouse-y = e.client-y - rect.top
			xp = mouse-x / this.refs.view.offset-width * 100
			yp = mouse-y / this.refs.view.offset-height * 100
			this.refs.view.style.background-position = xp + '% ' + yp + '%'

		this.click = () => {
			dialog = document.body.appendChild document.createElement 'mk-image-dialog' 
			riot.mount dialog, do
				image: @image
	</script>
</mk-images-viewer>
