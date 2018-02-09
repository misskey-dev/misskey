<mk-home-customize-page>
	<mk-home ref="home" mode="timeline" customize={ true }/>
	<style lang="stylus" scoped>
		:scope
			display block
	</style>
	<script lang="typescript">
		this.on('mount', () => {
			document.title = 'Misskey - ホームのカスタマイズ';
		});
	</script>
</mk-home-customize-page>
