mk-search-page
	mk-ui@ui: mk-search@search(query={ parent.opts.query })

style.
	display block

script.
	@mixin \ui-progress

	@on \mount ~>
		@Progress.start!

		@refs.ui.refs.search.on \loaded ~>
			@Progress.done!
