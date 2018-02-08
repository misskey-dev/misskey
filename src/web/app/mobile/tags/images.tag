<mk-images>
	<template each={ image in images }>
		<mk-images-image image={ image }/>
	</template>
	<style lang="stylus" scoped>
		:scope
			display grid
			grid-gap 4px
			height 256px

			@media (max-width 500px)
				height 192px
	</style>
	<script lang="typescript">
		this.images = this.opts.images;

		this.on('mount', () => {
			if (this.images.length == 1) {
				this.root.style.gridTemplateRows = '1fr';

				this.tags['mk-images-image'].root.style.gridColumn = '1 / 2';
				this.tags['mk-images-image'].root.style.gridRow = '1 / 2';
			} else if (this.images.length == 2) {
				this.root.style.gridTemplateColumns = '1fr 1fr';
				this.root.style.gridTemplateRows = '1fr';

				this.tags['mk-images-image'][0].root.style.gridColumn = '1 / 2';
				this.tags['mk-images-image'][0].root.style.gridRow = '1 / 2';
				this.tags['mk-images-image'][1].root.style.gridColumn = '2 / 3';
				this.tags['mk-images-image'][1].root.style.gridRow = '1 / 2';
			} else if (this.images.length == 3) {
				this.root.style.gridTemplateColumns = '1fr 0.5fr';
				this.root.style.gridTemplateRows = '1fr 1fr';

				this.tags['mk-images-image'][0].root.style.gridColumn = '1 / 2';
				this.tags['mk-images-image'][0].root.style.gridRow = '1 / 3';
				this.tags['mk-images-image'][1].root.style.gridColumn = '2 / 3';
				this.tags['mk-images-image'][1].root.style.gridRow = '1 / 2';
				this.tags['mk-images-image'][2].root.style.gridColumn = '2 / 3';
				this.tags['mk-images-image'][2].root.style.gridRow = '2 / 3';
			} else if (this.images.length == 4) {
				this.root.style.gridTemplateColumns = '1fr 1fr';
				this.root.style.gridTemplateRows = '1fr 1fr';

				this.tags['mk-images-image'][0].root.style.gridColumn = '1 / 2';
				this.tags['mk-images-image'][0].root.style.gridRow = '1 / 2';
				this.tags['mk-images-image'][1].root.style.gridColumn = '2 / 3';
				this.tags['mk-images-image'][1].root.style.gridRow = '1 / 2';
				this.tags['mk-images-image'][2].root.style.gridColumn = '1 / 2';
				this.tags['mk-images-image'][2].root.style.gridRow = '2 / 3';
				this.tags['mk-images-image'][3].root.style.gridColumn = '2 / 3';
				this.tags['mk-images-image'][3].root.style.gridRow = '2 / 3';
			}
		});
	</script>
</mk-images>

<mk-images-image>
	<a ref="view" href={ image.url } target="_blank" style={ styles } title={ image.name }></a>
	<style lang="stylus" scoped>
		:scope
			display block
			overflow hidden
			border-radius 4px

			> a
				display block
				overflow hidden
				width 100%
				height 100%
				background-position center
				background-size cover

	</style>
	<script lang="typescript">
		this.image = this.opts.image;
		this.styles = {
			'background-color': this.image.properties.average_color ? `rgb(${this.image.properties.average_color.join(',')})` : 'transparent',
			'background-image': `url(${this.image.url}?thumbnail&size=512)`
		};
	</script>
</mk-images-image>
