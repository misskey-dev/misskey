<mk-number>
	<style>
		:scope
			display inline

	</style>
	<script>
		this.on('mount', () => {
			// バグ？ https://github.com/riot/riot/issues/2103
			#value = this.opts.value
			value = this.opts.riot-value
			max = this.opts.max

			if max? then if value > max then value = max

			this.root.innerHTML = value.to-locale-string!
	</script>
</mk-number>
