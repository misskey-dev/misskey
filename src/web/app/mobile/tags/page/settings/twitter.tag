<mk-twitter-setting-page>
	<mk-ui ref="ui">
		<mk-twitter-setting></mk-twitter-setting>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		this.mixin('ui');

		this.on('mount', () => {
			document.title = 'Misskey | Twitter連携';
			this.ui.trigger('title', '<i class="fa fa-twitter"></i>Twitter連携');
		});
	</script>
</mk-twitter-setting-page>
