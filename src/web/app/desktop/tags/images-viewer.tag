<mk-images-viewer>
	<virtual each={ image in images }>
		<mk-images-viewer-image image={ image } images={ images }/>
	</virtual>
	<style>
		:scope
			display grid
			grid-gap .25em
	</style>
	<script>
		this.images = this.opts.images;

		this.on('mount', () => {
			if (this.images.length == 1) {
				this.root.style.gridTemplateRows = '256px';

				this.tags['mk-images-viewer-image'].root.style.gridColumn = '1 / 2';
				this.tags['mk-images-viewer-image'].root.style.gridRow = '1 / 2';
			} else if (this.images.length == 2) {
				this.root.style.gridTemplateColumns = '50% 50%';
				this.root.style.gridTemplateRows = '256px';

				this.tags['mk-images-viewer-image'][0].root.style.gridColumn = '1 / 2';
				this.tags['mk-images-viewer-image'][0].root.style.gridRow = '1 / 2';
				this.tags['mk-images-viewer-image'][1].root.style.gridColumn = '2 / 3';
				this.tags['mk-images-viewer-image'][1].root.style.gridRow = '1 / 2';
			} else if (this.images.length == 3) {
				this.root.style.gridTemplateColumns = '70% 30%';
				this.root.style.gridTemplateRows = '128px 128px';

				this.tags['mk-images-viewer-image'][0].root.style.gridColumn = '1 / 2';
				this.tags['mk-images-viewer-image'][0].root.style.gridRow = '1 / 3';
				this.tags['mk-images-viewer-image'][1].root.style.gridColumn = '2 / 3';
				this.tags['mk-images-viewer-image'][1].root.style.gridRow = '1 / 2';
				this.tags['mk-images-viewer-image'][2].root.style.gridColumn = '2 / 3';
				this.tags['mk-images-viewer-image'][2].root.style.gridRow = '2 / 3';
			} else if (this.images.length == 4) {
				this.root.style.gridTemplateColumns = '50% 50%';
				this.root.style.gridTemplateRows = '128px 128px';

				this.tags['mk-images-viewer-image'][0].root.style.gridColumn = '1 / 2';
				this.tags['mk-images-viewer-image'][0].root.style.gridRow = '1 / 2';
				this.tags['mk-images-viewer-image'][1].root.style.gridColumn = '2 / 3';
				this.tags['mk-images-viewer-image'][1].root.style.gridRow = '1 / 2';
				this.tags['mk-images-viewer-image'][2].root.style.gridColumn = '1 / 2';
				this.tags['mk-images-viewer-image'][2].root.style.gridRow = '2 / 3';
				this.tags['mk-images-viewer-image'][3].root.style.gridColumn = '2 / 3';
				this.tags['mk-images-viewer-image'][3].root.style.gridRow = '2 / 3';
			}
		});
	</script>
</mk-images-viewer>

<mk-images-viewer-image>
	<div ref="view" onmousemove={ mousemove } onmouseleave={ mouseleave } style={ 'background-image: url(' + image.url + '?thumbnail&size=512' } onclick={ click }>
		<img ref="image" src={ image.url + '?thumbnail&size=512' } alt={ image.name } title={ image.name }/>
	</div>
	<style>
		:scope
			display block
			overflow hidden
			border-radius 4px

			> div
				cursor zoom-in
				overflow hidden
				width 100%
				height 100%
				background-position center

				> img
					display block
					visibility hidden
					max-width: 100%
					max-height: 256px

				&:not(:hover)
					background-size cover

	</style>
	<script>
		this.mousemove = e => {
			const rect = this.refs.view.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;
			const xp = mouseX / this.refs.view.offsetWidth * 100;
			const yp = mouseY / this.refs.view.offsetHeight * 100;
			this.refs.view.style.backgroundPosition = xp + '% ' + yp + '%';
			this.refs.view.style.backgroundImage = 'url("' + this.image.url + '?thumbnail")';
		};

		this.mouseleave = () => {
			this.refs.view.style.backgroundPosition = "";
		};

		this.click = () => {
			riot.mount(document.body.appendChild(document.createElement('mk-image-dialog')), {
				image: this.image
			});
		};

		this.image = this.opts.image;
	</script>
</mk-images-viewer-image>
