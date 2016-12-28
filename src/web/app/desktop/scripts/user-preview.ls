# User Preview
#================================

riot = require \riot

riot.mixin \user-preview do
	init: ->
		@on \mount ~>
			scan.call @
		@on \updated ~>
			scan.call @

		function scan
			elems = @root.query-selector-all '[data-user-preview]:not([data-user-preview-attached])'
			elems.for-each attach.bind @

function attach el
	el.set-attribute \data-user-preview-attached true
	user = el.get-attribute \data-user-preview

	tag = null

	show-timer = null
	hide-timer = null

	el.add-event-listener \mouseover ~>
		clear-timeout show-timer
		clear-timeout hide-timer
		show-timer := set-timeout ~>
			show!
		, 500ms

	el.add-event-listener \mouseleave ~>
		clear-timeout show-timer
		clear-timeout hide-timer
		hide-timer := set-timeout ~>
			close!
		, 500ms

	@on \unmount ~>
		clear-timeout show-timer
		clear-timeout hide-timer
		close!

	function show
		if tag?
			return

		preview = document.create-element \mk-user-preview

		rect = el.get-bounding-client-rect!
		x = rect.left + el.offset-width + window.page-x-offset
		y = rect.top + window.page-y-offset

		preview.style.top = y + \px
		preview.style.left = x + \px

		preview.add-event-listener \mouseover ~>
			clear-timeout hide-timer

		preview.add-event-listener \mouseleave ~>
			clear-timeout show-timer
			hide-timer := set-timeout ~>
				close!
			, 500ms

		tag := riot.mount (document.body.append-child preview), do
			user: user
		.0

	function close
		if tag?
			tag.close!
			tag := null
