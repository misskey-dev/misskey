mk-search
	mk-search-posts@posts(query={ query })

style.
	display block

script.
	@query = @opts.query
	
	@on \mount ~>
		@refs.posts.on \loaded ~>
			@trigger \loaded
