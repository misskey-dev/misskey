<mk-notifications-page>
	<mk-ui ref="ui">
		<mk-notifications ref="notifications"></mk-notifications>
	</mk-ui>
	<style type="stylus">
		:scope
			display block

	</style>
	<script>
		@mixin \ui
		@mixin \ui-progress

		@on \mount ~>
			document.title = 'Misskey | 通知'
			@ui.trigger \title '<i class="fa fa-bell-o"></i>通知'

			@Progress.start!

			@refs.ui.refs.notifications.on \loaded ~>
				@Progress.done!
	</script>
</mk-notifications-page>
