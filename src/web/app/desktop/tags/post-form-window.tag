<mk-post-form-window>
	<mk-window ref="window" is-modal={ true }>
		<yield to="header">
			<span if={ !parent.opts.reply }>%i18n:desktop.tags.mk-post-form-window.post%</span>
			<span if={ parent.opts.reply }>%i18n:desktop.tags.mk-post-form-window.reply%</span>
			<span class="files" if={ parent.files.length != 0 }>{ '%i18n:desktop.tags.mk-post-form-window.attaches%'.replace('{}', parent.files.length) }</span>
			<span class="uploading-files" if={ parent.uploadingFiles.length != 0 }>{ '%i18n:desktop.tags.mk-post-form-window.uploading-media%'.replace('{}', parent.uploadingFiles.length) }<mk-ellipsis/></span>
		</yield>
		<yield to="content">
			<div class="ref" if={ parent.opts.reply }>
				<mk-post-preview post={ parent.opts.reply }/>
			</div>
			<div class="body">
				<mk-post-form ref="form" reply={ parent.opts.reply }/>
			</div>
		</yield>
	</mk-window>
	<style lang="stylus" scoped>
		:scope
			> mk-window

				[data-yield='header']
					> .files
					> .uploading-files
						margin-left 8px
						opacity 0.8

						&:before
							content '('

						&:after
							content ')'

				[data-yield='content']
					> .ref
						> mk-post-preview
							margin 16px 22px

	</style>
	<script>
		this.uploadingFiles = [];
		this.files = [];

		this.on('mount', () => {
			this.$refs.window.refs.form.focus();

			this.$refs.window.on('closed', () => {
				this.$destroy();
			});

			this.$refs.window.refs.form.on('post', () => {
				this.$refs.window.close();
			});

			this.$refs.window.refs.form.on('change-uploading-files', files => {
				this.update({
					uploadingFiles: files || []
				});
			});

			this.$refs.window.refs.form.on('change-files', files => {
				this.update({
					files: files || []
				});
			});
		});
	</script>
</mk-post-form-window>
