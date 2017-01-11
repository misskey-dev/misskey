<mk-drive-browser-folder-contextmenu>
	<mk-contextmenu ref="ctx">
		<ul>
			<li onclick="{ parent.move }">
				<p><i class="fa fa-arrow-right"></i>このフォルダへ移動</p>
			</li>
			<li onclick="{ parent.newWindow }">
				<p><i class="fa fa-share-square-o"></i>新しいウィンドウで表示</p>
			</li>
			<li class="separator"></li>
			<li onclick="{ parent.rename }">
				<p><i class="fa fa-i-cursor"></i>名前を変更</p>
			</li>
			<li class="separator"></li>
			<li onclick="{ parent.delete }">
				<p><i class="fa fa-trash-o"></i>削除</p>
			</li>
		</ul>
	</mk-contextmenu>
	<script>
		@mixin \api
		@mixin \input-dialog

		@browser = @opts.browser
		@folder = @opts.folder

		@open = (pos) ~>
			@refs.ctx.open pos

			@refs.ctx.on \closed ~>
				@trigger \closed
				@unmount!

		@move = ~>
			@browser.move @folder.id
			@refs.ctx.close!

		@new-window = ~>
			@browser.new-window @folder.id
			@refs.ctx.close!

		@create-folder = ~>
			@browser.create-folder!
			@refs.ctx.close!

		@upload = ~>
			@browser.select-lcoal-file!
			@refs.ctx.close!

		@rename = ~>
			@refs.ctx.close!

			name <~ @input-dialog do
				'フォルダ名の変更'
				'新しいフォルダ名を入力してください'
				@folder.name

			@api \drive/folders/update do
				folder_id: @folder.id
				name: name
			.then ~>
				# something
			.catch (err) ~>
				console.error err
	</script>
</mk-drive-browser-folder-contextmenu>
