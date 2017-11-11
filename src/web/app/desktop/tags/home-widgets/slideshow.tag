<mk-slideshow-home-widget>
	<div onclick={ choose }>
		<p if={ folder === undefined }>クリックしてフォルダを指定してください</p>
		<p if={ folder !== undefined && images.length == 0 && !fetching }>このフォルダには画像がありません</p>
		<div ref="slideA" class="slide a"></div>
		<div ref="slideB" class="slide b"></div>
	</div>
	<button onclick={ resize }><i class="fa fa-expand"></i></button>
	<style>
		:scope
			display block
			overflow hidden
			background #fff

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

		this.mixin('i');
		this.mixin('api');

		this.size = this.opts.data.hasOwnProperty('size') ? this.opts.data.size : 0;
		this.folder = this.opts.data.hasOwnProperty('folder') ? this.opts.data.folder : undefined;
		this.images = [];
		this.fetching = true;

		this.on('mount', () => {
			this.applySize();

			if (this.folder !== undefined) {
				this.fetch();
			}

			this.clock = setInterval(this.change, 10000);
		});

		this.on('unmount', () => {
			clearInterval(this.clock);
		});

		this.applySize = () => {
			let h;

			if (this.size == 1) {
				h = 250;
			} else {
				h = 170;
			}

			this.root.style.height = `${h}px`;
		};

		this.resize = () => {
			this.size++;
			if (this.size == 2) this.size = 0;

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
				folder_id: this.folder,
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
				this.folder = folder ? folder.id : null;
				this.fetch();
				this.save();
			});
		};

		this.save = () => {
			// Save state
			this.api('i/update_home', {
				id: this.opts.id,
				data: {
					folder: this.folder,
					size: this.size
				}
			}).then(() => {
				const w = this.I.client_settings.home.find(w => w.id == this.opts.id);
				w.data.folder = this.folder;
				w.data.size = this.size;
				this.I.update();
			});
		};
	</script>
</mk-slideshow-home-widget>
