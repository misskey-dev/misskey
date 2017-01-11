<mk-url><a href={ url } target={ opts.target }><span class="schema">{ schema }//</span><span class="hostname">{ hostname }</span><span class="port" if={ port != '' }>:{ port }</span><span class="pathname" if={ pathname != '' }>{ pathname }</span><span class="query">{ query }</span><span class="hash">{ hash }</span></a>
	<style type="stylus">
		:scope
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

	</style>
	<script>
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
	</script>
</mk-url>
