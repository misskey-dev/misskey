mk-url
	a(href={ url }, target={ opts.target })
		span.schema { schema }//
		span.hostname { hostname }
		span.port(if={ port != '' }) :{ port }
		span.pathname(if={ pathname != '' }) { pathname }
		span.query { query }
		span.hash { hash }

style.
	> a
		&:after
			content "\f14c"
			display inline-block
			padding-left 2px
			font-family FontAwesome
			font-size .9em
			font-weight 400
			font-style normal

		> .schema
			opacity 0.5

		> .hostname
			font-weight bold

		> .pathname
			opacity 0.8

		> .query
			opacity 0.5

		> .hash
			font-style italic

script.
	@url = @opts.href

	@on \before-mount ~>
		parser = document.create-element \a
		parser.href = @url

		@schema = parser.protocol
		@hostname = parser.hostname
		@port = parser.port
		@pathname = parser.pathname
		@query = parser.search
		@hash = parser.hash

		@update!
