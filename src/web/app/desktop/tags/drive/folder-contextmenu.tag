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

		this.browser = this.opts.browser
		this.folder = this.opts.folder

		open(pos) {
			this.refs.ctx.open pos

			this.refs.ctx.on('closed', () => {
				this.trigger('closed');
				this.unmount();

		move() {
			this.browser.move this.folder.id
			this.refs.ctx.close!

		new-window() {
			this.browser.new-window this.folder.id
			this.refs.ctx.close!

		create-folder() {
			this.browser.create-folder!
			this.refs.ctx.close!

		upload() {
			this.browser.select-lcoal-file!
			this.refs.ctx.close!

		rename() {
			this.refs.ctx.close!

			name <~ @input-dialog do
				'フォルダ名の変更'
				'新しいフォルダ名を入力してください'
				this.folder.name

			this.api 'drive/folders/update' do
				folder_id: this.folder.id
				name: name
			.then =>
				// something
			.catch (err) =>
				console.error err
	</script>
</mk-drive-browser-folder-contextmenu>
