<mk-repost-form-window>
	<mk-window ref="window" is-modal={ true } colored={ true }><yield to="header"><i class="fa fa-retweet"></i>この投稿をRepostしますか？</yield>
<yield to="content">
		<mk-repost-form ref="form" post={ parent.opts.post }></mk-repost-form></yield>
	</mk-window>
	<style>
		:scope
			> mk-window
				[data-yield='header']
					> i
						margin-right 4px

	</style>
	<script>
		this.onDocumentKeydown = e => {
			if (e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREA') {
				if (e.which == 27) { // Esc
					this.refs.window.close();
				}
			}
		};

		this.on('mount', () => {
			this.refs.window.refs.form.on('cancel', () => {
				this.refs.window.close();
			});

			this.refs.window.refs.form.on('posted', () => {
				this.refs.window.close();
			});

			document.addEventListener('keydown', this.onDocumentKeydown);

			this.refs.window.on('closed', () => {
				this.unmount();
			});
		});

		this.on('unmount', () => {
			document.removeEventListener('keydown', this.onDocumentKeydown);
		});
	</script>
</mk-repost-form-window>
