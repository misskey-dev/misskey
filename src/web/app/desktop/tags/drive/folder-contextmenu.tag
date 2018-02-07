<mk-drive-browser-folder-contextmenu>
	<mk-contextmenu ref="ctx">
		<ul>
			<li @click="parent.move">
				<p>%fa:arrow-right%%i18n:desktop.tags.mk-drive-browser-folder-contextmenu.move-to-this-folder%</p>
			</li>
			<li @click="parent.newWindow">
				<p>%fa:R window-restore%%i18n:desktop.tags.mk-drive-browser-folder-contextmenu.show-in-new-window%</p>
			</li>
			<li class="separator"></li>
			<li @click="parent.rename">
				<p>%fa:i-cursor%%i18n:desktop.tags.mk-drive-browser-folder-contextmenu.rename%</p>
			</li>
			<li class="separator"></li>
			<li @click="parent.delete">
				<p>%fa:R trash-alt%%i18n:common.delete%</p>
			</li>
		</ul>
	</mk-contextmenu>
	<script>
		import inputDialog from '../../scripts/input-dialog';

		this.mixin('api');

		this.browser = this.opts.browser;
		this.folder = this.opts.folder;

		this.open = pos => {
			this.$refs.ctx.open(pos);

			this.$refs.ctx.on('closed', () => {
				this.trigger('closed');
				this.unmount();
			});
		};

		this.move = () => {
			this.browser.move(this.folder.id);
			this.$refs.ctx.close();
		};

		this.newWindow = () => {
			this.browser.newWindow(this.folder.id);
			this.$refs.ctx.close();
		};

		this.createFolder = () => {
			this.browser.createFolder();
			this.$refs.ctx.close();
		};

		this.rename = () => {
			this.$refs.ctx.close();

			inputDialog('%i18n:desktop.tags.mk-drive-browser-folder-contextmenu.rename-folder%', '%i18n:desktop.tags.mk-drive-browser-folder-contextmenu.input-new-folder-name%', this.folder.name, name => {
				this.api('drive/folders/update', {
					folder_id: this.folder.id,
					name: name
				});
			});
		};
	</script>
</mk-drive-browser-folder-contextmenu>
