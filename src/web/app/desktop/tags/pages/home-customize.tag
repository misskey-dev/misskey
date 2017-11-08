<mk-home-customize-page>
	<mk-ui ref="ui" page="timeline">
		<mk-home ref="home" mode={ parent.opts.mode } customize={ true }/>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		this.on('mount', () => {
			document.title = 'Misskey - ホームのカスタマイズ';
		});
	</script>
</mk-home-customize-page>
