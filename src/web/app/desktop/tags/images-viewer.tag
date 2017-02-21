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
		this.images = this.opts.images;
		this.image = this.images[0];

		this.mousemove = e => {
			const rect = this.refs.view.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;
			const xp = mouseX / this.refs.view.offsetWidth * 100;
			const yp = mouseY / this.refs.view.offsetHeight * 100;
			this.refs.view.style.backgroundPosition = xp + '% ' + yp + '%';
		};

		this.click = () => {
			riot.mount(document.body.appendChild(document.createElement('mk-image-dialog')), {
				image: this.image
			});
		};
	</script>
</mk-images-viewer>
