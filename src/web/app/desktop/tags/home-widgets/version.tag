<mk-version-home-widget>
	<p>ver { version } (葵 aoi)</p>
	<style>
		:scope
			display block
			overflow visible !important

			> p
				display block
				margin 0
				padding 0 12px
				text-align center
				font-size 0.7em
				color #aaa

	</style>
	<script>
		this.mixin('widget');

		this.version = VERSION;
	</script>
</mk-version-home-widget>
