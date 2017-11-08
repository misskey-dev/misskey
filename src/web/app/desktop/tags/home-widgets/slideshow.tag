<mk-slideshow-home-widget>
	<div onclick={ choose }>
		<p if={ folder === undefined }>クリックしてフォルダを指定してください</p>
		<p if={ folder !== undefined && images.length == 0 }>このフォルダには画像がありません</p>
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
		this.fetching = false;

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

			// Save state
			this.I.client_settings.home.filter(w => w.id == this.opts.id)[0].data.size = this.size;
			this.api('i/update_home', {
				home: this.I.client_settings.home
			}).then(() => {
				this.I.update();
			});
		};

		this.change = () => {
			if (this.images.length == 0) return;
			if (this.index >= this.images.length) this.index = 0;

			const img = `url(${ this.images[this.index].url }?thumbnail&size=1024)`;

			this.refs.slideB.style.backgroundImage = img;

			this.index++;

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
					images: images,
					index: 0
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

				// Save state
				this.I.client_settings.home.filter(w => w.id == this.opts.id)[0].data.folder = this.folder;
				this.api('i/update_home', {
					home: this.I.client_settings.home
				}).then(() => {
					this.I.update();
				});
			});
		};
	</script>
</mk-slideshow-home-widget>
