<mk-number>
	<style>
		:scope
			display inline
	</style>
	<script>
		this.on('mount', () => {
			// https://github.com/riot/riot/issues/2103
			//value = this.opts.value
			let value = this.opts.riotValue;
			const max = this.opts.max;

			if (max != null && value > max) value = max;

			this.root.innerHTML = value.toLocaleString();
		});
	</script>
</mk-number>
