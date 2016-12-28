mk-search-page
	mk-ui@ui: mk-search@search(query={ parent.opts.query })

style.
	display block

script.
	@mixin \ui
	@mixin \ui-progress

	@on \mount ~>
		document.title = '検索: ' + @opts.query + ' | Misskey'
		# TODO: クエリをHTMLエスケープ
		@ui.trigger \title '<i class="fa fa-search"></i>' + @opts.query

		@Progress.start!

		@refs.ui.refs.search.on \loaded ~>
			@Progress.done!
