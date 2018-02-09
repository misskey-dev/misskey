<mk-raw>
	<style lang="stylus" scoped>
		:scope
			display inline
	</style>
	<script lang="typescript">
		this.root.innerHTML = this.opts.content;

		this.on('updated', () => {
			this.root.innerHTML = this.opts.content;
		});
	</script>
</mk-raw>
