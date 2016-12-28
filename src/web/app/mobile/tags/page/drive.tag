mk-drive-page
	mk-ui@ui: mk-drive@browser(folder={ parent.opts.folder }, file={ parent.opts.file })

style.
	display block

script.
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
			@ui.trigger \title '<i class="fa fa-cloud"></i>ドライブ'

			# Rewrite URL
			history.push-state null null '/i/drive'

		@refs.ui.refs.browser.on \cd (folder) ~>
			# TODO: escape html characters in folder.name
			@ui.trigger \title '<i class="fa fa-folder-open"></i>' + folder.name

		@refs.ui.refs.browser.on \move (folder) ~>
			# Rewrite URL
			history.push-state null null '/i/drive/folder/' + folder.id

		@refs.ui.refs.browser.on \open-file (file) ~>
			# TODO: escape html characters in file.name
			@ui.trigger \title '<mk-file-type-icon class="icon"></mk-file-type-icon>' + file.name

			# Rewrite URL
			history.push-state null null '/i/drive/file/' + file.id

			riot.mount \mk-file-type-icon do
				file: file
