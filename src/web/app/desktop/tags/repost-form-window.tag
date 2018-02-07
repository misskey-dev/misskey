<mk-repost-form-window>
	<mk-window ref="window" is-modal={ true }>
		<yield to="header">
			%fa:retweet%%i18n:desktop.tags.mk-repost-form-window.title%
		</yield>
		<yield to="content">
			<mk-repost-form ref="form" post={ parent.opts.post }/>
		</yield>
	</mk-window>
	<style lang="stylus" scoped>
		:scope
			> mk-window
				[data-yield='header']
					> [data-fa]
						margin-right 4px

	</style>
	<script lang="typescript">
		this.onDocumentKeydown = e => {
			if (e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREA') {
				if (e.which == 27) { // Esc
					this.$refs.window.close();
				}
			}
		};

		this.on('mount', () => {
			this.$refs.window.refs.form.on('cancel', () => {
				this.$refs.window.close();
			});

			this.$refs.window.refs.form.on('posted', () => {
				this.$refs.window.close();
			});

			document.addEventListener('keydown', this.onDocumentKeydown);

			this.$refs.window.on('closed', () => {
				this.$destroy();
			});
		});

		this.on('unmount', () => {
			document.removeEventListener('keydown', this.onDocumentKeydown);
		});
	</script>
</mk-repost-form-window>
