<mk-drive-browser-nav-folder data-draghover={ draghover } onclick={ onclick } ondragover={ ondragover } ondragenter={ ondragenter } ondragleave={ ondragleave } ondrop={ ondrop }><i class="fa fa-cloud" if={ folder == null }></i><span>{ folder == null ? 'ドライブ' : folder.name }</span>
	<style>
		:scope
			&[data-draghover]
				background #eee

	</style>
	<script>
		this.mixin('api');

		// Riotのバグでnullを渡しても""になる
		// https://github.com/riot/riot/issues/2080
		#this.folder = this.opts.folder
		this.folder = if this.opts.folder? and this.opts.folder != '' then this.opts.folder else null
		this.browser = this.parent

		this.hover = false

		this.onclick = () => {
			this.browser.move this.folder

		this.onmouseover = () => {
			this.hover = true

		this.onmouseout = () => {
			this.hover = false

		this.ondragover = (e) => {
			e.preventDefault();
			e.stopPropagation();

			// このフォルダがルートかつカレントディレクトリならドロップ禁止
			if this.folder == null and this.browser.folder == null
				e.dataTransfer.dropEffect = 'none' 
			// ドラッグされてきたものがファイルだったら
			else if e.dataTransfer.effectAllowed == 'all' 
				e.dataTransfer.dropEffect = 'copy' 
			else
				e.dataTransfer.dropEffect = 'move' 
			return false

		this.ondragenter = () => {
			if this.folder != null or this.browser.folder != null
				this.draghover = true

		this.ondragleave = () => {
			if this.folder != null or this.browser.folder != null
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
					folder_id: if this.folder? then this.folder.id else null
				.then =>
					// something
				.catch (err, text-status) =>
					console.error err

			// (ドライブの)フォルダーだったら
			else if obj.type == 'folder' 
				folder = obj.id
				// 移動先が自分自身ならreject
				if this.folder? and folder == this.folder.id
					return false
				this.browser.remove-folder folder
				this.api('drive/folders/update', {
					folder_id: folder
					parent_id: if this.folder? then this.folder.id else null
				.then =>
					// something
				.catch (err, text-status) =>
					console.error err

			return false
	</script>
</mk-drive-browser-nav-folder>
