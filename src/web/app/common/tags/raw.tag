<mk-raw>
	<style>
		:scope
			display inline
	</style>
	<script>
		this.root.innerHTML = this.opts.content;

		this.on('updated', () => {
			this.root.innerHTML = this.opts.content;
		});
	</script>
</mk-raw>
