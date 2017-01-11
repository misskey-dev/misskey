<mk-post-form-window>
	<mk-window ref="window" is-modal={ true } colored={ true }><yield to="header"><span if={ !parent.opts.reply }>新規投稿</span><span if={ parent.opts.reply }>返信</span><span class="files" if={ parent.files.length != 0 }>添付: { parent.files.length }ファイル</span><span class="uploading-files" if={ parent.uploadingFiles.length != 0 }>{ parent.uploadingFiles.length }個のファイルをアップロード中
			<mk-ellipsis></mk-ellipsis></span></yield>
<yield to="content">
		<div class="ref" if={ parent.opts.reply }>
			<mk-post-preview post={ parent.opts.reply }></mk-post-preview>
		</div>
		<div class="body">
			<mk-post-form ref="form" reply={ parent.opts.reply }></mk-post-form>
		</div></yield>
	</mk-window>
	<style type="stylus">
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
		@uploading-files = []
		@files = []

		@on \mount ~>
			@refs.window.refs.form.focus!

			@refs.window.on \closed ~>
				@unmount!

			@refs.window.refs.form.on \post ~>
				@refs.window.close!

			@refs.window.refs.form.on \change-uploading-files (files) ~>
				@uploading-files = files
				@update!

			@refs.window.refs.form.on \change-files (files) ~>
				@files = files
				@update!
	</script>
</mk-post-form-window>
