<mk-drive-browser-window>
	<mk-window ref="window" is-modal={ false } width={ '800px' } height={ '500px' }><yield to="header"><i class="fa fa-cloud"></i>ドライブ</yield>
<yield to="content">
		<mk-drive-browser multiple={ true } folder={ parent.folder }></mk-drive-browser></yield>
	</mk-window>
	<style type="stylus">
		:scope
			> mk-window
				[data-yield='header']
					> i
						margin-right 4px

				[data-yield='content']
					> mk-drive-browser
						height 100%

	</style>
	<script>
		@folder = if @opts.folder? then @opts.folder else null

		@on \mount ~>
			@refs.window.on \closed ~>
				@unmount!

		@close = ~>
			@refs.window.close!
	</script>
</mk-drive-browser-window>
