mk-tips-home-widget
	p@tip
		i.fa.fa-lightbulb-o
		span@text

style.
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

script.
	@tips = [
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

	@on \mount ~>
		@set!
		@clock = set-interval @change, 20000ms

	@on \unmount ~>
		clear-interval @clock

	@set = ~>
		@refs.text.innerHTML = @tips[Math.floor Math.random! * @tips.length]
		@update!

	@change = ~>
		Velocity @refs.tip, {
			opacity: 0
		} {
			duration: 500ms
			easing: \linear
			complete: @set
		}

		Velocity @refs.tip, {
			opacity: 1
		} {
			duration: 500ms
			easing: \linear
		}
