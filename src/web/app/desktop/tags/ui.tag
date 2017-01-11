<mk-ui>
	<div class="global" ref="global">
		<mk-ui-header ref="header" page="{ opts.page }"></mk-ui-header>
		<mk-set-avatar-suggestion if="{ SIGNIN &amp;&amp; I.avatar_id == null }"></mk-set-avatar-suggestion>
		<mk-set-banner-suggestion if="{ SIGNIN &amp;&amp; I.banner_id == null }"></mk-set-banner-suggestion>
		<div class="content"><yield /></div>
	</div>
	<mk-stream-indicator></mk-stream-indicator>
	<style type="stylus">
		:scope
			display block

	</style>
	<script>
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
	</script>
</mk-ui>
