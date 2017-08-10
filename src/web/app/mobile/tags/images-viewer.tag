<mk-images-viewer>
	<div class="image" ref="view" onclick={ click }><img ref="img" src={ image.url + '?thumbnail&size=512' } alt={ image.name } title={ image.name }/></div>
	<style>
		:scope
			display block
			overflow hidden
			border-radius 4px

			> .image

				> img
					display block
					max-height 256px
					max-width 100%
					margin 0 auto

	</style>
	<script>
		this.images = this.opts.images;
		this.image = this.images[0];

		this.click = () => {
			window.open(this.image.url);
		};
	</script>
</mk-images-viewer>
