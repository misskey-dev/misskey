<mk-drive-browser-folder data-is-contextmenu-showing={ isContextmenuShowing.toString() } data-draghover={ draghover.toString() } @click="onclick" onmouseover={ onmouseover } onmouseout={ onmouseout } ondragover={ ondragover } ondragenter={ ondragenter } ondragleave={ ondragleave } ondrop={ ondrop } oncontextmenu={ oncontextmenu } draggable="true" ondragstart={ ondragstart } ondragend={ ondragend } title={ title }>
	<p class="name"><virtual v-if="hover">%fa:R folder-open .fw%</virtual><virtual v-if="!hover">%fa:R folder .fw%</virtual>{ folder.name }</p>
	<style lang="stylus" scoped>
		:scope
			display block
			padding 8px
			height 64px
			background lighten($theme-color, 95%)
			border-radius 4px

			&, *
				cursor pointer

			*
				pointer-events none

			&:hover
				background lighten($theme-color, 90%)

			&:active
				background lighten($theme-color, 85%)

			&[data-is-contextmenu-showing='true']
			&[data-draghover='true']
				&:after
					content ""
					pointer-events none
					position absolute
					top -4px
					right -4px
					bottom -4px
					left -4px
					border 2px dashed rgba($theme-color, 0.3)
					border-radius 4px

			&[data-draghover='true']
				background lighten($theme-color, 90%)

			> .name
				margin 0
				font-size 0.9em
				color darken($theme-color, 30%)

				> [data-fa]
					margin-right 4px
				  margin-left 2px
					text-align left

	</style>
	<script lang="typescript">
		import dialog from '../../scripts/dialog';

		this.mixin('api');

		this.folder = this.opts.folder;
		this.browser = this.parent;

		this.title = this.folder.name;
		this.hover = false;
		this.draghover = false;
		this.isContextmenuShowing = false;

		this.onclick = () => {
			this.browser.move(this.folder);
		};

		this.onmouseover = () => {
			this.hover = true;
		};

		this.onmouseout = () => {
			this.hover = false
		};

		this.ondragover = e => {
			e.preventDefault();
			e.stopPropagation();

			// 自分自身がドラッグされていない場合
			if (!this.isDragging) {
				// ドラッグされてきたものがファイルだったら
				if (e.dataTransfer.effectAllowed === 'all') {
					e.dataTransfer.dropEffect = 'copy';
				} else {
					e.dataTransfer.dropEffect = 'move';
				}
			} else {
				// 自分自身にはドロップさせない
				e.dataTransfer.dropEffect = 'none';
			}
			return false;
		};

		this.ondragenter = e => {
			e.preventDefault();
			if (!this.isDragging) this.draghover = true;
		};

		this.ondragleave = () => {
			this.draghover = false;
		};

		this.ondrop = e => {
			e.preventDefault();
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
					folder_id: this.folder.id
				});
			// (ドライブの)フォルダーだったら
			} else if (obj.type == 'folder') {
				const folder = obj.id;
				// 移動先が自分自身ならreject
				if (folder == this.folder.id) return false;
				this.browser.removeFolder(folder);
				this.api('drive/folders/update', {
					folder_id: folder,
					parent_id: this.folder.id
				}).then(() => {
					// something
				}).catch(err => {
					switch (err) {
						case 'detected-circular-definition':
							dialog('%fa:exclamation-triangle%%i18n:desktop.tags.mk-drive-browser-folder.unable-to-process%',
								'%i18n:desktop.tags.mk-drive-browser-folder.circular-reference-detected%', [{
								text: '%i18n:common.ok%'
							}]);
							break;
						default:
							alert('%i18n:desktop.tags.mk-drive-browser-folder.unhandled-error% ' + err);
					}
				});
			}

			return false;
		};

		this.ondragstart = e => {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text', JSON.stringify({
				type: 'folder',
				id: this.folder.id
			}));
			this.isDragging = true;

			// 親ブラウザに対して、ドラッグが開始されたフラグを立てる
			// (=あなたの子供が、ドラッグを開始しましたよ)
			this.browser.isDragSource = true;
		};

		this.ondragend = e => {
			this.isDragging = false;
			this.browser.isDragSource = false;
		};

		this.oncontextmenu = e => {
			e.preventDefault();
			e.stopImmediatePropagation();

			this.update({
				isContextmenuShowing: true
			});
			const ctx = riot.mount(document.body.appendChild(document.createElement('mk-drive-browser-folder-contextmenu')), {
				browser: this.browser,
				folder: this.folder
			})[0];
			ctx.open({
				x: e.pageX - window.pageXOffset,
				y: e.pageY - window.pageYOffset
			});
			ctx.on('closed', () => {
				this.update({
					isContextmenuShowing: false
				});
			});

			return false;
		};
	</script>
</mk-drive-browser-folder>
