<mk-drive-page>
	<mk-ui ref="ui">
		<mk-drive ref="browser" folder={ parent.opts.folder } file={ parent.opts.file }></mk-drive>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		this.mixin('ui');
		this.mixin('ui-progress');

		this.on('mount', () => {
			document.title = 'Misskey Drive';
			this.ui.trigger('title', '<i class="fa fa-cloud"></i>ドライブ');

			this.refs.ui.refs.browser.on('begin-fetch', () => {
				this.Progress.start();
			});

			this.refs.ui.refs.browser.on('fetched-mid', () => {
				this.Progress.set(0.5);
			});

			this.refs.ui.refs.browser.on('fetched', () => {
				this.Progress.done();
			});

			this.refs.ui.refs.browser.on('move-root', () => {
				const title = 'Misskey Drive';

				// Rewrite URL
				history.pushState(null, title, '/i/drive');

				document.title = title;
				this.ui.trigger('title', '<i class="fa fa-cloud"></i>ドライブ');
			});

			this.refs.ui.refs.browser.on('open-folder', (folder, silent) => {
				const title = folder.name + ' | Misskey Drive';

				if (!silent) {
					// Rewrite URL
					history.pushState(null, title, '/i/drive/folder/' + folder.id);
				}

				document.title = title;
				// TODO: escape html characters in folder.name
				this.ui.trigger('title', '<i class="fa fa-folder-open"></i>' + folder.name);
			});

			this.refs.ui.refs.browser.on('open-file', (file, silent) => {
				const title = file.name + ' | Misskey Drive';

				if (!silent) {
					// Rewrite URL
					history.pushState(null, title, '/i/drive/file/' + file.id);
				}

				document.title = title;
				// TODO: escape html characters in file.name
				this.ui.trigger('title', '<mk-file-type-icon class="icon"></mk-file-type-icon>' + file.name);
				riot.mount('mk-file-type-icon', {
					type: file.type
				});
			});
		});
	</script>
</mk-drive-page>
