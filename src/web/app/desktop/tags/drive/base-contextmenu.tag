mk-drive-browser-base-contextmenu
	mk-contextmenu@ctx
		ul
			li(onclick={ parent.create-folder }): p
				i.fa.fa-folder-o
				| フォルダーを作成
			li(onclick={ parent.upload }): p
				i.fa.fa-upload
				| ファイルをアップロード

script.
	@browser = @opts.browser

	@on \mount ~>
		@refs.ctx.on \closed ~>
			@trigger \closed
			@unmount!

	@open = (pos) ~>
		@refs.ctx.open pos

	@create-folder = ~>
		@browser.create-folder!
		@refs.ctx.close!

	@upload = ~>
		@browser.select-local-file!
		@refs.ctx.close!
