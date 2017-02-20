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
		this.tips = [
			'<kbd>t</kbd>でタイムラインにフォーカスできます'
			'<kbd>p</kbd>または<kbd>n</kbd>で投稿フォームを開きます'
			'投稿フォームにはファイルをドラッグ&ドロップできます'
			'投稿フォームにクリップボードにある画像データをペーストできます'
			'ドライブにファイルをドラッグ&ドロップしてアップロードできます'
			'ドライブでファイルをドラッグしてフォルダ移動できます'
			'ドライブでフォルダをドラッグしてフォルダ移動できます'
			'ホームをカスタマイズできます(準備中)'
			'MisskeyはMIT Licenseです'
		]

		this.on('mount', () => {
			@set!
			this.clock = setInterval @change, 20000ms

		this.on('unmount', () => {
			clearInterval @clock

		this.set = () => {
			this.refs.text.innerHTML = @tips[Math.floor Math.random! * @tips.length]
			this.update();

		this.change = () => {
			Velocity this.refs.tip, {
				opacity: 0
			} {
				duration: 500ms
				easing: 'linear' 
				complete: @set
			}

			Velocity this.refs.tip, {
				opacity: 1
			} {
				duration: 500ms
				easing: 'linear' 
			}
	</script>
</mk-tips-home-widget>
