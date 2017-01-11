<mk-drive-browser-base-contextmenu>
	<mk-contextmenu ref="ctx">
		<ul>
			<li onclick={ parent.createFolder }>
				<p><i class="fa fa-folder-o"></i>フォルダーを作成</p>
			</li>
			<li onclick={ parent.upload }>
				<p><i class="fa fa-upload"></i>ファイルをアップロード</p>
			</li>
		</ul>
	</mk-contextmenu>
	<script>
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
	</script>
</mk-drive-browser-base-contextmenu>
