<mk-drive-browser-folder-contextmenu>
	<mk-contextmenu ref="ctx">
		<ul>
			<li onclick={ parent.move }>
				<p><i class="fa fa-arrow-right"></i>このフォルダへ移動</p>
			</li>
			<li onclick={ parent.newWindow }>
				<p><i class="fa fa-share-square-o"></i>新しいウィンドウで表示</p>
			</li>
			<li class="separator"></li>
			<li onclick={ parent.rename }>
				<p><i class="fa fa-i-cursor"></i>名前を変更</p>
			</li>
			<li class="separator"></li>
			<li onclick={ parent.delete }>
				<p><i class="fa fa-trash-o"></i>削除</p>
			</li>
		</ul>
	</mk-contextmenu>
	<script>
		this.mixin('api');
		this.mixin('input-dialog');

		this.browser = this.opts.browser;
		this.folder = this.opts.folder;

		this.open = pos => {
			this.refs.ctx.open(pos);

			this.refs.ctx.on('closed', () => {
				this.trigger('closed');
				this.unmount();
			});
		};

		this.move = () => {
			this.browser.move(this.folder.id);
			this.refs.ctx.close();
		};

		this.newWindow = () => {
			this.browser.newWindow(this.folder.id);
			this.refs.ctx.close();
		};

		this.createFolder = () => {
			this.browser.createFolder();
			this.refs.ctx.close();
		};

		this.rename = () => {
			this.refs.ctx.close();

			this.inputialog('フォルダ名の変更', '新しいフォルダ名を入力してください', this.folder.name, name => {
				this.api('drive/folders/update', {
					folder_id: this.folder.id,
					name: name
				});
			});
		};
	</script>
</mk-drive-browser-folder-contextmenu>
