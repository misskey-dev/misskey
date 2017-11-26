<mk-home-customize-page>
	<mk-home ref="home" mode="timeline" customize={ true }/>
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
