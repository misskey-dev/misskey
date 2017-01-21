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
		@mixin \api
		@mixin \i
		@mixin \update-avatar
		@mixin \update-banner
		@mixin \update-wallpaper
		@mixin \input-dialog
		@mixin \NotImplementedException

		@browser = @opts.browser
		@file = @opts.file

		@on \mount ~>
			@refs.ctx.on \closed ~>
				@trigger \closed
				@unmount!

		@open = (pos) ~>
			@refs.ctx.open pos

		@rename = ~>
			@refs.ctx.close!

			name <~ @input-dialog do
				'ファイル名の変更'
				'新しいファイル名を入力してください'
				@file.name

			@api \drive/files/update do
				file_id: @file.id
				name: name
			.then ~>
				# something
			.catch (err) ~>
				console.error err

		@copy-url = ~>
			@NotImplementedException!

		@download = ~>
			@refs.ctx.close!

		@set-avatar = ~>
			@refs.ctx.close!
			@update-avatar @I, null, @file

		@set-banner = ~>
			@refs.ctx.close!
			@update-banner @I, null, @file

		@set-wallpaper = ~>
			@refs.ctx.close!
			@update-wallpaper @I, null, @file

		@add-app = ~>
			@NotImplementedException!
	</script>
</mk-drive-browser-file-contextmenu>
