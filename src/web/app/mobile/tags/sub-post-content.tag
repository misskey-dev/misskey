mk-sub-post-content
	div.body
		a.reply(if={ post.reply_to_id }): i.fa.fa-reply
		span@text
		a.quote(if={ post.repost_id }, href={ '/post:' + post.repost_id }) RP: ...
	details(if={ post.media })
		summary ({ post.media.length }枚の画像)
		mk-images-viewer(images={ post.media })

style.
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

script.
	@mixin \text

	@post = @opts.post

	@on \mount ~>
		if @post.text?
			tokens = @analyze @post.text
			@refs.text.innerHTML = @compile tokens, false

			@refs.text.children.for-each (e) ~>
				if e.tag-name == \MK-URL
					riot.mount e
