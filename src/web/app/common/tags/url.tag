<mk-url><a href={ url } target={ opts.target }><span class="schema">{ schema }//</span><span class="hostname">{ hostname }</span><span class="port" if={ port != '' }>:{ port }</span><span class="pathname" if={ pathname != '' }>{ pathname }</span><span class="query">{ query }</span><span class="hash">{ hash }</span></a>
	<style>
		:scope
			word-break break-all

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
		this.url = this.opts.href;

		this.on('before-mount', () => {
			parser = document.createElement('a'); 
			parser.href = this.url;

			this.schema = parser.protocol;
			this.hostname = parser.hostname;
			this.port = parser.port;
			this.pathname = parser.pathname;
			this.query = parser.search;
			this.hash = parser.hash;

			this.update();
		});
	</script>
</mk-url>
