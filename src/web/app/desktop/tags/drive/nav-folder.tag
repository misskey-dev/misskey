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

		onclick() {
			@browser.move @folder

		onmouseover() {
			this.hover = true

		onmouseout() {
			this.hover = false

		ondragover(e) {
			e.prevent-default!
			e.stop-propagation!

			// このフォルダがルートかつカレントディレクトリならドロップ禁止
			if @folder == null and @browser.folder == null
				e.data-transfer.drop-effect = 'none' 
			// ドラッグされてきたものがファイルだったら
			else if e.data-transfer.effect-allowed == 'all' 
				e.data-transfer.drop-effect = 'copy' 
			else
				e.data-transfer.drop-effect = 'move' 
			return false

		ondragenter() {
			if @folder != null or @browser.folder != null
				this.draghover = true

		ondragleave() {
			if @folder != null or @browser.folder != null
				this.draghover = false

		ondrop(e) {
			e.stop-propagation!
			this.draghover = false

			// ファイルだったら
			if e.data-transfer.files.length > 0
				Array.prototype.for-each.call e.data-transfer.files, (file) =>
					@browser.upload file, @folder
				return false

			// データ取得
			data = e.data-transfer.get-data 'text'
			if !data?
				return false

			// パース
			obj = JSON.parse data

			// (ドライブの)ファイルだったら
			if obj.type == 'file' 
				file = obj.id
				@browser.remove-file file
				this.api 'drive/files/update' do
					file_id: file
					folder_id: if @folder? then @folder.id else null
				.then =>
					// something
				.catch (err, text-status) =>
					console.error err

			// (ドライブの)フォルダーだったら
			else if obj.type == 'folder' 
				folder = obj.id
				// 移動先が自分自身ならreject
				if @folder? and folder == @folder.id
					return false
				@browser.remove-folder folder
				this.api 'drive/folders/update' do
					folder_id: folder
					parent_id: if @folder? then @folder.id else null
				.then =>
					// something
				.catch (err, text-status) =>
					console.error err

			return false
	</script>
</mk-drive-browser-nav-folder>
