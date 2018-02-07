<mk-drive-page>
	<mk-drive-browser ref="browser" folder={ opts.folder }/>
	<style lang="stylus" scoped>
		:scope
			display block
			position fixed
			width 100%
			height 100%
			background #fff

			> mk-drive-browser
				height 100%
	</style>
	<script>
		this.on('mount', () => {
			document.title = 'Misskey Drive';

			this.$refs.browser.on('move-root', () => {
				const title = 'Misskey Drive';

				// Rewrite URL
				history.pushState(null, title, '/i/drive');

				document.title = title;
			});

			this.$refs.browser.on('open-folder', folder => {
				const title = folder.name + ' | Misskey Drive';

				// Rewrite URL
				history.pushState(null, title, '/i/drive/folder/' + folder.id);

				document.title = title;
			});
		});
	</script>
</mk-drive-page>
