<mk-tips-home-widget>
	<p ref="tip"><i class="fa fa-lightbulb-o"></i><span ref="text"></span></p>
	<style>
		:scope
			display block
			background transparent !important
			border none !important
			overflow visible !important

			> p
				display block
				margin 0
				padding 0 12px
				text-align center
				font-size 0.7em
				color #999

				> i
					margin-right 4px

				kbd
					display inline
					padding 0 6px
					margin 0 2px
					font-size 1em
					font-family inherit
					border solid 1px #999
					border-radius 2px

	</style>
	<script>
		import anime from 'animejs';

		this.mixin('widget');

		this.tips = [
			'<kbd>t</kbd>でタイムラインにフォーカスできます',
			'<kbd>p</kbd>または<kbd>n</kbd>で投稿フォームを開きます',
			'投稿フォームにはファイルをドラッグ&ドロップできます',
			'投稿フォームにクリップボードにある画像データをペーストできます',
			'ドライブにファイルをドラッグ&ドロップしてアップロードできます',
			'ドライブでファイルをドラッグしてフォルダ移動できます',
			'ドライブでフォルダをドラッグしてフォルダ移動できます',
			'ホームをカスタマイズできます(準備中)',
			'MisskeyはMIT Licenseです'
		]

		this.on('mount', () => {
			this.set();
			this.clock = setInterval(this.change, 20000);
		});

		this.on('unmount', () => {
			clearInterval(this.clock);
		});

		this.set = () => {
			this.refs.text.innerHTML = this.tips[Math.floor(Math.random() * this.tips.length)];
		};

		this.change = () => {
			anime({
				targets: this.refs.tip,
				opacity: 0,
				duration: 500,
				easing: 'linear',
				complete: this.set
			});

			setTimeout(() => {
				anime({
					targets: this.refs.tip,
					opacity: 1,
					duration: 500,
					easing: 'linear'
				});
			}, 500);
		};
	</script>
</mk-tips-home-widget>
