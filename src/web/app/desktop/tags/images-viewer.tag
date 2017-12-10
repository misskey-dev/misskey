<mk-images-viewer>
	<virtual each={ image in images }>
		<mk-images-viewer-image ref="wrap" image={ image } images={ images }/>
	</virtual>
	<style>
		:scope
			display grid
			overflow hidden
			border-radius 4px
			grid-gap .25em

			> div
				cursor zoom-in
				overflow hidden
				background-position center

				> img
					visibility hidden
					max-width: 100%
					max-height: 256px

				&:not(:hover)
					background-size cover

				&:nth-child(1):nth-last-child(3)
					grid-row 1 / 3
	</style>
	<script>
		this.images = this.opts.images;

		this.on('mount', () => {
			if(this.images.length >= 3) this.refs.wrap.style.gridAutoRows = "9em";
			if(this.images.length == 2) this.refs.wrap.style.gridAutoRows = "12em";
			if(this.images.length == 1) this.refs.wrap.style.gridAutoRows = "256px";
			if(this.images.length == 4 || this.images.length == 2) this.refs.wrap.style.gridTemplateColumns = "repeat(2, 1fr)";
			if(this.images.length == 3) this.refs.wrap.style.gridTemplateColumns = "65% 1fr";
		})
	</script>
</mk-images-viewer>

<mk-images-viewer-image>
	<div ref="view" onmousemove={ mousemove } onmouseleave={ mouseleave } style={ 'background-image: url(' + image.url + '?thumbnail?size=512' } onclick={ click }><img ref="image" src={ image.url + '?thumbnail&size=512' } alt={ image.name } title={ image.name }/></div>
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
		}

		this.click = () => {
			riot.mount(document.body.appendChild(document.createElement('mk-image-dialog')), {
				image: this.image
			});
		};

		this.image = this.opts.image;
	</script>
</mk-images-viewer-image>