<mk-ui>
	<div class="global" ref="global">
		<mk-ui-header ref="header" ready={ ready }></mk-ui-header>
		<mk-ui-nav ref="nav" ready={ ready }></mk-ui-nav>
		<div class="content" ref="main"><yield /></div>
	</div>
	<mk-stream-indicator></mk-stream-indicator>
	<style type="stylus">
		:scope
			display block

			> .global
				> .content
					background #fff
	</style>
	<script>
		@mixin \stream

		@ready-count = 0
		@is-drawer-opening = false

		#@ui.on \notification (text) ~>
		#	alert text

		@on \mount ~>
			@stream.on \notification @on-stream-notification
			@ready!

		@on \unmount ~>
			@stream.off \notification @on-stream-notification

		@ready = ~>
			@ready-count++

			if @ready-count == 2
				@init-view-position!

		@init-view-position = ~>
			top = @refs.header.root.offset-height
			@refs.main.style.padding-top = top + \px

		@toggle-drawer = ~>
			@is-drawer-opening = !@is-drawer-opening
			@refs.nav.root.style.display = if @is-drawer-opening then \block else \none

		@on-stream-notification = (notification) ~>
			el = document.body.append-child document.create-element \mk-notify
			riot.mount el, do
				notification: notification
	</script>
</mk-ui>
