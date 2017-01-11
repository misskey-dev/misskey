<mk-post-page>
	<mk-ui ref="ui">
		<main>
			<mk-post-detail ref="detail" post="{ parent.post }"></mk-post-detail>
		</main>
	</mk-ui>
	<style type="stylus">
		:scope
			display block

			main
				padding 16px

				> mk-post-detail
					margin 0 auto

	</style>
	<script>
		@mixin \ui-progress

		@post = @opts.post

		@on \mount ~>
			@Progress.start!

			@refs.ui.refs.detail.on \post-fetched ~>
				@Progress.set 0.5

			@refs.ui.refs.detail.on \loaded ~>
				@Progress.done!
	</script>
</mk-post-page>
