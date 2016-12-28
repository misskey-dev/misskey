mk-ui
	div.global@global
		mk-ui-header@header(page={ opts.page })

		mk-set-avatar-suggestion(if={ SIGNIN && I.avatar_id == null })
		mk-set-banner-suggestion(if={ SIGNIN && I.banner_id == null })

		div.content
			<yield />

	mk-stream-indicator

style.
	display block

script.
	@mixin \i

	@open-post-form = ~>
		riot.mount document.body.append-child document.create-element \mk-post-form-window

	@set-root-layout = ~>
		@root.style.padding-top = @refs.header.root.client-height + \px

	@on \mount ~>
		@set-root-layout!
		document.add-event-listener \keydown @onkeydown

	@on \unmount ~>
		document.remove-event-listener \keydown @onkeydown

	@onkeydown = (e) ~>
		tag = e.target.tag-name.to-lower-case!
		if tag != \input and tag != \textarea
			if e.which == 80 or e.which == 78 # p or n
				e.prevent-default!
				@open-post-form!
