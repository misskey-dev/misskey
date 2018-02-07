<mk-home>
	<mk-home-timeline ref="tl"/>
	<style lang="stylus" scoped>
		:scope
			display block

			> mk-home-timeline
				max-width 600px
				margin 0 auto
				padding 8px

			@media (min-width 500px)
				padding 16px

	</style>
	<script lang="typescript">
		this.on('mount', () => {
			this.$refs.tl.on('loaded', () => {
				this.trigger('loaded');
			});
		});
	</script>
</mk-home>
