<mk-drive-browser-nav-folder data-draghover={ draghover } @click="onclick" ondragover={ ondragover } ondragenter={ ondragenter } ondragleave={ ondragleave } ondrop={ ondrop }>
	<virtual v-if="folder == null">%fa:cloud%</virtual><span>{ folder == null ? '%i18n:desktop.tags.mk-drive-browser-nav-folder.drive%' : folder.name }</span>
	<style lang="stylus" scoped>
		:scope
			&[data-draghover]
				background #eee

	</style>
	<script>
		this.mixin('api');

		this.folder = this.opts.folder ? this.opts.folder : null;
		this.browser = this.parent;

		this.hover = false;

		this.onclick = () => {
			this.browser.move(this.folder);
		};

		this.onmouseover = () => {
			this.hover = true
		};

		this.onmouseout = () => {
			this.hover = false
		};

		this.ondragover = e => {
			e.preventDefault();
			e.stopPropagation();

			// このフォルダがルートかつカレントディレクトリならドロップ禁止
			if (this.folder == null && this.browser.folder == null) {
				e.dataTransfer.dropEffect = 'none';
			// ドラッグされてきたものがファイルだったら
			} else if (e.dataTransfer.effectAllowed == 'all') {
				e.dataTransfer.dropEffect = 'copy';
			} else {
				e.dataTransfer.dropEffect = 'move';
			}
			return false;
		};

		this.ondragenter = () => {
			if (this.folder || this.browser.folder) this.draghover = true;
		};

		this.ondragleave = () => {
			if (this.folder || this.browser.folder) this.draghover = false;
		};

		this.ondrop = e => {
			e.stopPropagation();
			this.draghover = false;

			// ファイルだったら
			if (e.dataTransfer.files.length > 0) {
				Array.from(e.dataTransfer.files).forEach(file => {
					this.browser.upload(file, this.folder);
				});
				return false;
			};

			// データ取得
			const data = e.dataTransfer.getData('text');
			if (data == null) return false;

			// パース
			// TODO: Validate JSON
			const obj = JSON.parse(data);

			// (ドライブの)ファイルだったら
			if (obj.type == 'file') {
				const file = obj.id;
				this.browser.removeFile(file);
				this.api('drive/files/update', {
					file_id: file,
					folder_id: this.folder ? this.folder.id : null
				});
			// (ドライブの)フォルダーだったら
			} else if (obj.type == 'folder') {
				const folder = obj.id;
				// 移動先が自分自身ならreject
				if (this.folder && folder == this.folder.id) return false;
				this.browser.removeFolder(folder);
				this.api('drive/folders/update', {
					folder_id: folder,
					parent_id: this.folder ? this.folder.id : null
				});
			}

			return false;
		};
	</script>
</mk-drive-browser-nav-folder>
