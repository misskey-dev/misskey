<mk-drive-browser-base-contextmenu>
	<mk-contextmenu ref="ctx">
		<ul>
			<li onclick={ parent.createFolder }>
				<p>%fa:folder-o%%i18n:desktop.tags.mk-drive-browser-base-contextmenu.create-folder%</p>
			</li>
			<li onclick={ parent.upload }>
				<p>%fa:upload%%i18n:desktop.tags.mk-drive-browser-base-contextmenu.upload%</p>
			</li>
			<li onclick={ parent.urlUpload }>
				<p>%fa:cloud-upload%%i18n:desktop.tags.mk-drive-browser-base-contextmenu.url-upload%</p>
			</li>
		</ul>
	</mk-contextmenu>
	<script>
		this.browser = this.opts.browser;

		this.on('mount', () => {
			this.refs.ctx.on('closed', () => {
				this.trigger('closed');
				this.unmount();
			});
		});

		this.open = pos => {
			this.refs.ctx.open(pos);
		};

		this.createFolder = () => {
			this.browser.createFolder();
			this.refs.ctx.close();
		};

		this.upload = () => {
			this.browser.selectLocalFile();
			this.refs.ctx.close();
		};

		this.urlUpload = () => {
			this.browser.urlUpload();
			this.refs.ctx.close();
		};
	</script>
</mk-drive-browser-base-contextmenu>
