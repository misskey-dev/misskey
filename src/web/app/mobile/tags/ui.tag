<mk-ui>
	<div class="global" ref="global">
		<mk-ui-header ref="header" ready="{ ready }"></mk-ui-header>
		<mk-ui-nav ref="nav" ready="{ ready }"></mk-ui-nav>
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

		#@ui.on \notification (text) ~>
		#	alert text

		@on \mount ~>
			@stream.on \notification @on-stream-notification
			@ready!

		@on \unmount ~>
			@stream.off \notification @on-stream-notification
			@slide.slide-close!

		@ready = ~>
			@ready-count++

			if @ready-count == 2
				@slide = SpSlidemenu @refs.main, @refs.nav.root, \#hamburger {direction: \left}
				@init-view-position!

		@init-view-position = ~>
			top = @refs.header.root.offset-height
			@refs.main.style.padding-top = top + \px
			@refs.nav.root.style.margin-top = top + \px
			@refs.nav.root.query-selector '.body > .content' .style.padding-bottom = top + \px

		@on-stream-notification = (notification) ~>
			el = document.body.append-child document.create-element \mk-notify
			riot.mount el, do
				notification: notification
	</script>
</mk-ui>
