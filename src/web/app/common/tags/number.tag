<mk-number>
	<style>
		:scope
			display inline

	</style>
	<script>
		@on \mount ~>
			# バグ？ https://github.com/riot/riot/issues/2103
			#value = @opts.value
			value = @opts.riot-value
			max = @opts.max

			if max? then if value > max then value = max

			@root.innerHTML = value.to-locale-string!
	</script>
</mk-number>
