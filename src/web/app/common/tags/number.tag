<mk-number>
	<style lang="stylus" scoped>
		:scope
			display inline
	</style>
	<script>
		this.on('mount', () => {
			let value = this.opts.value;
			const max = this.opts.max;

			if (max != null && value > max) value = max;

			this.root.innerHTML = value.toLocaleString();
		});
	</script>
</mk-number>
