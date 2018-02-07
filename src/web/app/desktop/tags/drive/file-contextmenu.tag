<mk-drive-browser-file-contextmenu>
	<mk-contextmenu ref="ctx">
		<ul>
			<li @click="parent.rename">
				<p>%fa:i-cursor%%i18n:desktop.tags.mk-drive-browser-file-contextmenu.rename%</p>
			</li>
			<li @click="parent.copyUrl">
				<p>%fa:link%%i18n:desktop.tags.mk-drive-browser-file-contextmenu.copy-url%</p>
			</li>
			<li><a href={ parent.file.url + '?download' } download={ parent.file.name } @click="parent.download">%fa:download%%i18n:desktop.tags.mk-drive-browser-file-contextmenu.download%</a></li>
			<li class="separator"></li>
			<li @click="parent.delete">
				<p>%fa:R trash-alt%%i18n:common.delete%</p>
			</li>
			<li class="separator"></li>
			<li class="has-child">
				<p>%i18n:desktop.tags.mk-drive-browser-file-contextmenu.else-files%%fa:caret-right%</p>
				<ul>
					<li @click="parent.setAvatar">
						<p>%i18n:desktop.tags.mk-drive-browser-file-contextmenu.set-as-avatar%</p>
					</li>
					<li @click="parent.setBanner">
						<p>%i18n:desktop.tags.mk-drive-browser-file-contextmenu.set-as-banner%</p>
					</li>
				</ul>
			</li>
			<li class="has-child">
				<p>%i18n:desktop.tags.mk-drive-browser-file-contextmenu.open-in-app%...%fa:caret-right%</p>
				<ul>
					<li @click="parent.addApp">
						<p>%i18n:desktop.tags.mk-drive-browser-file-contextmenu.add-app%...</p>
					</li>
				</ul>
			</li>
		</ul>
	</mk-contextmenu>
	<script lang="typescript">
		import copyToClipboard from '../../../common/scripts/copy-to-clipboard';
		import dialog from '../../scripts/dialog';
		import inputDialog from '../../scripts/input-dialog';
		import updateAvatar from '../../scripts/update-avatar';
		import NotImplementedException from '../../scripts/not-implemented-exception';

		this.mixin('i');
		this.mixin('api');

		this.browser = this.opts.browser;
		this.file = this.opts.file;

		this.on('mount', () => {
			this.$refs.ctx.on('closed', () => {
				this.trigger('closed');
				this.$destroy();
			});
		});

		this.open = pos => {
			this.$refs.ctx.open(pos);
		};

		this.rename = () => {
			this.$refs.ctx.close();

			inputDialog('%i18n:desktop.tags.mk-drive-browser-file-contextmenu.rename-file%', '%i18n:desktop.tags.mk-drive-browser-file-contextmenu.input-new-file-name%', this.file.name, name => {
				this.api('drive/files/update', {
					file_id: this.file.id,
					name: name
				})
			});
		};

		this.copyUrl = () => {
			copyToClipboard(this.file.url);
			this.$refs.ctx.close();
			dialog('%fa:check%%i18n:desktop.tags.mk-drive-browser-file-contextmenu.copied%',
				'%i18n:desktop.tags.mk-drive-browser-file-contextmenu.copied-url-to-clipboard%', [{
				text: '%i18n:common.ok%'
			}]);
		};

		this.download = () => {
			this.$refs.ctx.close();
		};

		this.setAvatar = () => {
			this.$refs.ctx.close();
			updateAvatar(this.I, null, this.file);
		};

		this.setBanner = () => {
			this.$refs.ctx.close();
			updateBanner(this.I, null, this.file);
		};

		this.addApp = () => {
			NotImplementedException();
		};
	</script>
</mk-drive-browser-file-contextmenu>
