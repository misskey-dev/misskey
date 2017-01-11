<mk-home>
	<mk-home-timeline ref="tl"></mk-home-timeline>
	<style type="stylus">
		:scope
			display block

			> mk-home-timeline
				max-width 600px
				margin 0 auto

			@media (min-width 500px)
				padding 16px

	</style>
	<script>
		@on \mount ~>
			@refs.tl.on \loaded ~>
				@trigger \loaded
	</script>
</mk-home>
