<mk-set-banner-suggestion @click="set">
	<p><b>バナーを設定</b>してみませんか？
		<button @click="close">%fa:times%</button>
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
		import updateBanner from '../scripts/update-banner';

		this.mixin('i');

		this.set = () => {
			updateBanner(this.I);
		};

		this.close = e => {
			e.preventDefault();
			e.stopPropagation();
			this.unmount();
		};
	</script>
</mk-set-banner-suggestion>
