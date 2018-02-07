<mk-images>
	<virtual each={ image in images }>
		<mk-images-image image={ image }/>
	</virtual>
	<style>
		:scope
			display grid
			grid-gap 4px
			height 256px
	</style>
	<script>
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
	<a ref="view"
		href={ image.url }
		onmousemove={ mousemove }
		onmouseleave={ mouseleave }
		style={ styles }
		@click="click"
		title={ image.name }></a>
	<style>
		:scope
			display block
			overflow hidden
			border-radius 4px

			> a
				display block
				cursor zoom-in
				overflow hidden
				width 100%
				height 100%
				background-position center

				&:not(:hover)
					background-size cover

	</style>
	<script>
		this.image = this.opts.image;
		this.styles = {
			'background-color': this.image.properties.average_color ? `rgb(${this.image.properties.average_color.join(',')})` : 'transparent',
			'background-image': `url(${this.image.url}?thumbnail&size=512)`
		};

		this.mousemove = e => {
			const rect = this.$refs.view.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;
			const xp = mouseX / this.$refs.view.offsetWidth * 100;
			const yp = mouseY / this.$refs.view.offsetHeight * 100;
			this.$refs.view.style.backgroundPosition = xp + '% ' + yp + '%';
			this.$refs.view.style.backgroundImage = 'url("' + this.image.url + '?thumbnail")';
		};

		this.mouseleave = () => {
			this.$refs.view.style.backgroundPosition = '';
		};

		this.click = ev => {
			ev.preventDefault();
			riot.mount(document.body.appendChild(document.createElement('mk-image-dialog')), {
				image: this.image
			});
			return false;
		};
	</script>
</mk-images-image>

<mk-image-dialog>
	<div class="bg" ref="bg" @click="close"></div><img ref="img" src={ image.url } alt={ image.name } title={ image.name } @click="close"/>
	<style>
		:scope
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

	</style>
	<script>
		import anime from 'animejs';

		this.image = this.opts.image;

		this.on('mount', () => {
			anime({
				targets: this.root,
				opacity: 1,
				duration: 100,
				easing: 'linear'
			});
		});

		this.close = () => {
			anime({
				targets: this.root,
				opacity: 0,
				duration: 100,
				easing: 'linear',
				complete: () => this.$destroy()
			});
		};
	</script>
</mk-image-dialog>
