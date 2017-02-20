<mk-drive-browser-file-contextmenu>
	<mk-contextmenu ref="ctx">
		<ul>
			<li onclick={ parent.rename }>
				<p><i class="fa fa-i-cursor"></i>名前を変更</p>
			</li>
			<li onclick={ parent.copyUrl }>
				<p><i class="fa fa-link"></i>URLをコピー</p>
			</li>
			<li><a href={ parent.file.url + '?download' } download={ parent.file.name } onclick={ parent.download }><i class="fa fa-download"></i>ダウンロード</a></li>
			<li class="separator"></li>
			<li onclick={ parent.delete }>
				<p><i class="fa fa-trash-o"></i>削除</p>
			</li>
			<li class="separator"></li>
			<li class="has-child">
				<p>その他...<i class="fa fa-caret-right"></i></p>
				<ul>
					<li onclick={ parent.setAvatar }>
						<p>アバターに設定</p>
					</li>
					<li onclick={ parent.setBanner }>
						<p>バナーに設定</p>
					</li>
					<li onclick={ parent.setWallpaper }>
						<p>壁紙に設定</p>
					</li>
				</ul>
			</li>
			<li class="has-child">
				<p>アプリで開く...<i class="fa fa-caret-right"></i></p>
				<ul>
					<li onclick={ parent.addApp }>
						<p>アプリを追加...</p>
					</li>
				</ul>
			</li>
		</ul>
	</mk-contextmenu>
	<script>
		this.mixin('api');
		this.mixin('i');
		this.mixin('update-avatar');
		this.mixin('update-banner');
		this.mixin('update-wallpaper');
		this.mixin('input-dialog');
		this.mixin('NotImplementedException');

		this.browser = this.opts.browser
		this.file = this.opts.file

		this.on('mount', () => {
			this.refs.ctx.on('closed', () => {
				this.trigger('closed');
				this.unmount();

		this.open = (pos) => {
			this.refs.ctx.open pos

		this.rename = () => {
			this.refs.ctx.close();

			name <~ @input-dialog do
				'ファイル名の変更'
				'新しいファイル名を入力してください'
				this.file.name

			this.api('drive/files/update', {
				file_id: this.file.id
				name: name
			.then =>
				// something
			.catch (err) =>
				console.error err

		this.copy-url = () => {
			@NotImplementedException!

		this.download = () => {
			this.refs.ctx.close();

		this.set-avatar = () => {
			this.refs.ctx.close();
			@update-avatar this.I, null, this.file

		this.set-banner = () => {
			this.refs.ctx.close();
			@update-banner this.I, null, this.file

		this.set-wallpaper = () => {
			this.refs.ctx.close();
			@update-wallpaper this.I, null, this.file

		this.add-app = () => {
			@NotImplementedException!
	</script>
</mk-drive-browser-file-contextmenu>
