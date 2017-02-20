<mk-drive-browser-folder data-is-contextmenu-showing={ isContextmenuShowing.toString() } data-draghover={ draghover.toString() } onclick={ onclick } onmouseover={ onmouseover } onmouseout={ onmouseout } ondragover={ ondragover } ondragenter={ ondragenter } ondragleave={ ondragleave } ondrop={ ondrop } oncontextmenu={ oncontextmenu } draggable="true" ondragstart={ ondragstart } ondragend={ ondragend } title={ title }>
	<p class="name"><i class="fa fa-fw { fa-folder-o: !hover, fa-folder-open-o: hover }"></i>{ folder.name }</p>
	<style>
		:scope
			display block
			margin 4px
			padding 8px
			width 144px
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

				> i
					margin-right 4px
				  margin-left 2px
					text-align left

	</style>
	<script>
		this.mixin('api');
		this.mixin('dialog');

		this.folder = this.opts.folder
		this.browser = this.parent

		this.title = this.folder.name
		this.hover = false
		this.draghover = false
		this.is-contextmenu-showing = false

		this.onclick = () => {
			this.browser.move this.folder

		this.onmouseover = () => {
			this.hover = true

		this.onmouseout = () => {
			this.hover = false

		this.ondragover = (e) => {
			e.preventDefault();
			e.stopPropagation();

			// 自分自身がドラッグされていない場合
			if !@is-dragging
				// ドラッグされてきたものがファイルだったら
				if e.dataTransfer.effectAllowed == 'all' 
					e.dataTransfer.dropEffect = 'copy' 
				else
					e.dataTransfer.dropEffect = 'move' 
			else
				// 自分自身にはドロップさせない
				e.dataTransfer.dropEffect = 'none' 
			return false

		this.ondragenter = () => {
			if !@is-dragging
				this.draghover = true

		this.ondragleave = () => {
			this.draghover = false

		this.ondrop = (e) => {
			e.stopPropagation();
			this.draghover = false

			// ファイルだったら
			if e.dataTransfer.files.length > 0
				Array.prototype.forEach.call e.dataTransfer.files, (file) =>
					this.browser.upload file, this.folder
				return false

			// データ取得
			data = e.dataTransfer.get-data 'text'
			if !data?
				return false

			// パース
			obj = JSON.parse data

			// (ドライブの)ファイルだったら
			if obj.type == 'file' 
				file = obj.id
				this.browser.remove-file file
				this.api('drive/files/update', {
					file_id: file
					folder_id: this.folder.id
				.then =>
					// something
				.catch (err, text-status) =>
					console.error err

			// (ドライブの)フォルダーだったら
			else if obj.type == 'folder' 
				folder = obj.id
				// 移動先が自分自身ならreject
				if folder == this.folder.id
					return false
				this.browser.remove-folder folder
				this.api('drive/folders/update', {
					folder_id: folder
					parent_id: this.folder.id
				.then =>
					// something
				.catch (err) =>
					if err == 'detected-circular-definition'
						@dialog do
							'<i class="fa fa-exclamation-triangle"></i>操作を完了できません'
							'移動先のフォルダーは、移動するフォルダーのサブフォルダーです。'
							[
								text: 'OK' 
							]

			return false

		this.ondragstart = (e) => {
			e.dataTransfer.effectAllowed = 'move' 
			e.dataTransfer.set-data 'text' JSON.stringify do
				type: 'folder' 
				id: this.folder.id
			this.is-dragging = true

			// 親ブラウザに対して、ドラッグが開始されたフラグを立てる
			// (=あなたの子供が、ドラッグを開始しましたよ)
			this.browser.is-drag-source = true

		this.ondragend = (e) => {
			this.is-dragging = false
			this.browser.is-drag-source = false

		this.oncontextmenu = (e) => {
			e.preventDefault();
			e.stopImmediatePropagation();

			this.is-contextmenu-showing = true
			this.update();
			ctx = document.body.appendChild(document.createElement('mk-drive-browser-folder-contextmenu'));
 			ctx = riot.mount ctx, do
				browser: this.browser
				folder: this.folder
			ctx = ctx.0
			ctx.open do
				x: e.pageX - window.pageXOffset
				y: e.pageY - window.pageYOffset
			ctx.on('closed', () => {
				this.is-contextmenu-showing = false
				this.update();

			return false
	</script>
</mk-drive-browser-folder>
