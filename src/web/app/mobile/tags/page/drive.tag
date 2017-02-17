<mk-drive-page>
	<mk-ui ref="ui">
		<mk-drive ref="browser" folder={ parent.opts.folder } file={ parent.opts.file }></mk-drive>
	</mk-ui>
	<style type="stylus">
		:scope
			display block

	</style>
	<script>
		@mixin \ui
		@mixin \ui-progress

		@on \mount ~>
			document.title = 'Misskey Drive'
			@ui.trigger \title '<i class="fa fa-cloud"></i>ドライブ'

			@refs.ui.refs.browser.on \begin-load ~>
				@Progress.start!

			@refs.ui.refs.browser.on \loaded-mid ~>
				@Progress.set 0.5

			@refs.ui.refs.browser.on \loaded ~>
				@Progress.done!

			@refs.ui.refs.browser.on \move-root ~>
				title = 'Misskey Drive'

				# Rewrite URL
				history.push-state null, title, '/i/drive'

				document.title = title
				@ui.trigger \title '<i class="fa fa-cloud"></i>ドライブ'

			@refs.ui.refs.browser.on \open-folder (folder, silent) ~>
				title = folder.name + ' | Misskey Drive'

				if !silent
					# Rewrite URL
					history.push-state null, title, '/i/drive/folder/' + folder.id

				document.title = title
				# TODO: escape html characters in folder.name
				@ui.trigger \title '<i class="fa fa-folder-open"></i>' + folder.name

			@refs.ui.refs.browser.on \open-file (file, silent) ~>
				title = file.name + ' | Misskey Drive'

				if !silent
					# Rewrite URL
					history.push-state null, title, '/i/drive/file/' + file.id

				document.title = title
				# TODO: escape html characters in file.name
				@ui.trigger \title '<mk-file-type-icon class="icon"></mk-file-type-icon>' + file.name
				riot.mount \mk-file-type-icon do
					type: file.type

	</script>
</mk-drive-page>
