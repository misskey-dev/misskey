mk-drive-browser-folder-contextmenu
	mk-contextmenu@ctx: ul
		li(onclick={ parent.move }): p
			i.fa.fa-arrow-right
			| このフォルダへ移動
		li(onclick={ parent.new-window }): p
			i.fa.fa-share-square-o
			| 新しいウィンドウで表示
		li.separator
		li(onclick={ parent.rename }): p
			i.fa.fa-i-cursor
			| 名前を変更
		li.separator
		li(onclick={ parent.delete }): p
			i.fa.fa-trash-o
			| 削除

script.
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
