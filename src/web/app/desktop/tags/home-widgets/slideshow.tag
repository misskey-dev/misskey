<mk-slideshow-home-widget>
	<div @click="choose">
		<p if={ data.folder === undefined }>クリックしてフォルダを指定してください</p>
		<p if={ data.folder !== undefined && images.length == 0 && !fetching }>このフォルダには画像がありません</p>
		<div ref="slideA" class="slide a"></div>
		<div ref="slideB" class="slide b"></div>
	</div>
	<button @click="resize">%fa:expand%</button>
	<style>
		:scope
			display block
			overflow hidden
			background #fff
			border solid 1px rgba(0, 0, 0, 0.075)
			border-radius 6px

			&:hover > button
				display block

			> button
				position absolute
				left 0
				bottom 0
				display none
				padding 4px
				font-size 24px
				color #fff
				text-shadow 0 0 8px #000

			> div
				width 100%
				height 100%
				cursor pointer

				> *
					pointer-events none

				> .slide
					position absolute
					top 0
					left 0
					width 100%
					height 100%
					background-size cover
					background-position center

					&.b
						opacity 0

	</style>
	<script>
		import anime from 'animejs';

		this.data = {
			folder: undefined,
			size: 0
		};

		this.mixin('widget');

		this.images = [];
		this.fetching = true;

		this.on('mount', () => {
			this.applySize();

			if (this.data.folder !== undefined) {
				this.fetch();
			}

			this.clock = setInterval(this.change, 10000);
		});

		this.on('unmount', () => {
			clearInterval(this.clock);
		});

		this.applySize = () => {
			let h;

			if (this.data.size == 1) {
				h = 250;
			} else {
				h = 170;
			}

			this.root.style.height = `${h}px`;
		};

		this.resize = () => {
			this.data.size++;
			if (this.data.size == 2) this.data.size = 0;

			this.applySize();
			this.save();
		};

		this.change = () => {
			if (this.images.length == 0) return;

			const index = Math.floor(Math.random() * this.images.length);
			const img = `url(${ this.images[index].url }?thumbnail&size=1024)`;

			this.refs.slideB.style.backgroundImage = img;

			anime({
				targets: this.refs.slideB,
				opacity: 1,
				duration: 1000,
				easing: 'linear',
				complete: () => {
					this.refs.slideA.style.backgroundImage = img;
					anime({
						targets: this.refs.slideB,
						opacity: 0,
						duration: 0
					});
				}
			});
		};

		this.fetch = () => {
			this.update({
				fetching: true
			});

			this.api('drive/files', {
				folder_id: this.data.folder,
				type: 'image/*',
				limit: 100
			}).then(images => {
				this.update({
					fetching: false,
					images: images
				});
				this.refs.slideA.style.backgroundImage = '';
				this.refs.slideB.style.backgroundImage = '';
				this.change();
			});
		};

		this.choose = () => {
			const i = riot.mount(document.body.appendChild(document.createElement('mk-select-folder-from-drive-window')))[0];
			i.one('selected', folder => {
				this.data.folder = folder ? folder.id : null;
				this.fetch();
				this.save();
			});
		};
	</script>
</mk-slideshow-home-widget>
