<mk-drive-browser-base-contextmenu>
	<mk-contextmenu ref="ctx">
		<ul>
			<li onclick={ parent.createFolder }>
				<p><i class="fa fa-folder-o"></i>フォルダーを作成</p>
			</li>
			<li onclick={ parent.upload }>
				<p><i class="fa fa-upload"></i>ファイルをアップロード</p>
			</li>
			<li onclick={ parent.urlUpload }>
				<p><i class="fa fa-cloud-upload"></i>URLからアップロード</p>
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
