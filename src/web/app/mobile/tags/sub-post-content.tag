<mk-sub-post-content>
	<div class="body"><a class="reply" if={ post.reply_to_id }><i class="fa fa-reply"></i></a><span ref="text"></span><a class="quote" if={ post.repost_id } href={ '/post:' + post.repost_id }>RP: ...</a></div>
	<details if={ post.media }>
		<summary>({ post.media.length }枚の画像)</summary>
		<mk-images-viewer images={ post.media }></mk-images-viewer>
	</details>
	<style type="stylus">
		:scope
			display block
			word-wrap break-word

			> .body
				> .reply
					margin-right 6px
					color #717171

				> .quote
					margin-left 4px
					font-style oblique
					color #a0bf46

	</style>
	<script>
		@mixin \text

		@post = @opts.post

		@on \mount ~>
			if @post.text?
				tokens = @analyze @post.text
				@refs.text.innerHTML = @compile tokens, false

				@refs.text.children.for-each (e) ~>
					if e.tag-name == \MK-URL
						riot.mount e
	</script>
</mk-sub-post-content>
