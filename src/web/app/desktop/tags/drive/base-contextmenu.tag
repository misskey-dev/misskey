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
		this.browser = this.opts.browser

		this.on('mount', () => {
			this.refs.ctx.on('closed', () => {
				this.trigger('closed');
				this.unmount();

		open(pos) {
			this.refs.ctx.open pos

		create-folder() {
			@browser.create-folder!
			this.refs.ctx.close!

		upload() {
			@browser.select-local-file!
			this.refs.ctx.close!

		url-upload() {
			@browser.url-upload!
			this.refs.ctx.close!
	</script>
</mk-drive-browser-base-contextmenu>
