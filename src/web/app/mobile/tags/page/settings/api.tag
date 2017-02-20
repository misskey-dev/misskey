<mk-api-info-page>
	<mk-ui ref="ui">
		<mk-api-info></mk-api-info>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		this.mixin('ui');

		this.on('mount', () => {
			document.title = 'Misskey | API';
			this.ui.trigger('title', '<i class="fa fa-key"></i>API');
		});
	</script>
</mk-api-info-page>
