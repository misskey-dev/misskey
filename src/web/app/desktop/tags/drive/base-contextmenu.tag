<mk-drive-browser-base-contextmenu>
	<mk-contextmenu ref="ctx">
		<ul>
			<li @click="parent.createFolder">
				<p>%fa:R folder%%i18n:desktop.tags.mk-drive-browser-base-contextmenu.create-folder%</p>
			</li>
			<li @click="parent.upload">
				<p>%fa:upload%%i18n:desktop.tags.mk-drive-browser-base-contextmenu.upload%</p>
			</li>
			<li @click="parent.urlUpload">
				<p>%fa:cloud-upload-alt%%i18n:desktop.tags.mk-drive-browser-base-contextmenu.url-upload%</p>
			</li>
		</ul>
	</mk-contextmenu>
	<script lang="typescript">
		this.browser = this.opts.browser;

		this.on('mount', () => {
			this.$refs.ctx.on('closed', () => {
				this.$emit('closed');
				this.$destroy();
			});
		});

		this.open = pos => {
			this.$refs.ctx.open(pos);
		};

		this.createFolder = () => {
			this.browser.createFolder();
			this.$refs.ctx.close();
		};

		this.upload = () => {
			this.browser.selectLocalFile();
			this.$refs.ctx.close();
		};

		this.urlUpload = () => {
			this.browser.urlUpload();
			this.$refs.ctx.close();
		};
	</script>
</mk-drive-browser-base-contextmenu>
