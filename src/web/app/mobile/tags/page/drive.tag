<mk-drive-page>
	<mk-ui ref="ui">
		<mk-drive ref="browser" folder={ parent.opts.folder } file={ parent.opts.file } is-naked={ true } top={ 48 }/>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		import ui from '../../scripts/ui-event';
		import Progress from '../../../common/scripts/loading';

		this.on('mount', () => {
			document.title = 'Misskey Drive';
			ui.trigger('title', '%fa:cloud%%i18n:mobile.tags.mk-drive-page.drive%');

			ui.trigger('func', () => {
				this.$refs.ui.refs.browser.openContextMenu();
			}, '%fa:ellipsis-h%');

			this.$refs.ui.refs.browser.on('begin-fetch', () => {
				Progress.start();
			});

			this.$refs.ui.refs.browser.on('fetched-mid', () => {
				Progress.set(0.5);
			});

			this.$refs.ui.refs.browser.on('fetched', () => {
				Progress.done();
			});

			this.$refs.ui.refs.browser.on('move-root', () => {
				const title = 'Misskey Drive';

				// Rewrite URL
				history.pushState(null, title, '/i/drive');

				document.title = title;
				ui.trigger('title', '%fa:cloud%%i18n:mobile.tags.mk-drive-page.drive%');
			});

			this.$refs.ui.refs.browser.on('open-folder', (folder, silent) => {
				const title = folder.name + ' | Misskey Drive';

				if (!silent) {
					// Rewrite URL
					history.pushState(null, title, '/i/drive/folder/' + folder.id);
				}

				document.title = title;
				// TODO: escape html characters in folder.name
				ui.trigger('title', '%fa:R folder-open%' + folder.name);
			});

			this.$refs.ui.refs.browser.on('open-file', (file, silent) => {
				const title = file.name + ' | Misskey Drive';

				if (!silent) {
					// Rewrite URL
					history.pushState(null, title, '/i/drive/file/' + file.id);
				}

				document.title = title;
				// TODO: escape html characters in file.name
				ui.trigger('title', '<mk-file-type-icon class="icon"></mk-file-type-icon>' + file.name);
				riot.mount('mk-file-type-icon', {
					type: file.type
				});
			});
		});
	</script>
</mk-drive-page>
