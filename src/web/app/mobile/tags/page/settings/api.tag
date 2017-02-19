<mk-api-info-page>
	<mk-ui ref="ui">
		<mk-api-info></mk-api-info>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		@mixin \ui

		@on \mount ~>
			document.title = 'Misskey | API'
			@ui.trigger \title '<i class="fa fa-key"></i>API'
	</script>
</mk-api-info-page>
