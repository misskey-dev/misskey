<mk-settings-window>
	<mk-window ref="window" is-modal={ true } width={ '700px' } height={ '550px' }><yield to="header"><i class="fa fa-cog"></i>設定</yield>
<yield to="content">
		<mk-settings></mk-settings></yield>
	</mk-window>
	<style type="stylus">
		:scope
			> mk-window
				[data-yield='header']
					> i
						margin-right 4px

				[data-yield='content']
					overflow hidden

	</style>
	<script>
		@on \mount ~>
			@refs.window.on \closed ~>
				@unmount!

		@close = ~>
			@refs.window.close!
	</script>
</mk-settings-window>
