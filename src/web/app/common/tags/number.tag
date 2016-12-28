mk-number

style.
	display inline

script.
	@on \mount ~>
		# バグ？ https://github.com/riot/riot/issues/2103
		#value = @opts.value
		value = @opts.riot-value
		max = @opts.max

		if max? then if value > max then value = max

		@root.innerHTML = value.to-locale-string!
