<mk-set-banner-suggestion onclick={ set }>
	<p><b>バナーを設定</b>してみませんか？
		<button onclick={ close }><i class="fa fa-times"></i></button>
	</p>
	<style>
		:scope
			display block
			cursor pointer
			color #fff
			background #a8cad0

			&:hover
				background #70abb5

			> p
				display block
				margin 0 auto
				padding 8px
				max-width 1024px

				> a
					font-weight bold
					color #fff

				> button
					position absolute
					top 0
					right 0
					padding 8px
					color #fff

	</style>
	<script>
		@mixin \i
		@mixin \update-banner

		@set = ~>
			@update-banner @I

		@close = (e) ~>
			e.prevent-default!
			e.stop-propagation!
			@unmount!
	</script>
</mk-set-banner-suggestion>
