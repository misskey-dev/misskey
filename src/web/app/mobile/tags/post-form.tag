<mk-post-form>
	<header>
		<div>
			<button class="cancel" onclick={ cancel }><i class="fa fa-times"></i></button>
			<div><span class="text-count { over: refs.text.value.length > 500 }">{ 500 - refs.text.value.length }</span>
				<button class="submit" onclick={ post }>投稿</button>
			</div>
		</div>
	</header>
	<div class="form">
		<mk-post-preview if={ opts.reply } post={ opts.reply }></mk-post-preview>
		<textarea ref="text" disabled={ wait } oninput={ update } onkeypress={ onkeypress } onpaste={ onpaste } placeholder={ opts.reply ? 'この投稿への返信...' : 'いまどうしてる？' }></textarea>
		<div class="attaches" if={ files.length != 0 }>
			<ul class="files" ref="attaches">
				<li class="file" each={ files }>
					<div class="img" style="background-image: url({ url + '?thumbnail&size=64' })" title={ name }></div>
				</li>
				<li class="add" if={ files.length < 4 } title="PCからファイルを添付" onclick={ selectFile }><i class="fa fa-plus"></i></li>
			</ul>
		</div>
		<mk-uploader ref="uploader"></mk-uploader>
		<button ref="upload" onclick={ selectFile }><i class="fa fa-upload"></i></button>
		<button ref="drive" onclick={ selectFileFromDrive }><i class="fa fa-cloud"></i></button>
		<button class="cat" onclick={ cat }><i class="fa fa-smile-o"></i></button>
		<input ref="file" type="file" accept="image/*" multiple="multiple" onchange={ changeFile }/>
	</div>
	<style type="stylus">
		:scope
			display block
			padding-top 50px

			> header
				position fixed
				z-index 1000
				top 0
				left 0
				width 100%
				height 50px
				background #fff

				> div
					max-width 500px
					margin 0 auto

					> .cancel
						width 50px
						line-height 50px
						font-size 24px
						color #555

					> div
						position absolute
						top 0
						right 0

						> .text-count
							line-height 50px
							color #657786

						> .submit
							margin 8px
							padding 0 16px
							line-height 34px
							color $theme-color-foreground
							background $theme-color
							border-radius 4px

							&:disabled
								opacity 0.7

			> .form
				max-width 500px
				margin 0 auto

				> mk-post-preview
					padding 16px

				> .attaches

					> .files
						display block
						margin 0
						padding 4px
						list-style none

						&:after
							content ""
							display block
							clear both

						> .file
							display block
							float left
							margin 4px
							padding 0
							cursor move

							&:hover > .remove
								display block

							> .img
								width 64px
								height 64px
								background-size cover
								background-position center center

							> .remove
								display none
								position absolute
								top -6px
								right -6px
								width 16px
								height 16px
								cursor pointer

						> .add
							display block
							float left
							margin 4px
							padding 0
							border dashed 2px rgba($theme-color, 0.2)
							cursor pointer

							&:hover
								border-color rgba($theme-color, 0.3)

								> i
									color rgba($theme-color, 0.4)

							> i
								display block
								width 60px
								height 60px
								line-height 60px
								text-align center
								font-size 1.2em
								color rgba($theme-color, 0.2)

				> mk-uploader
					margin 8px 0 0 0
					padding 8px

				> [ref='file']
					display none

				> [ref='text']
					display block
					padding 12px
					margin 0
					width 100%
					max-width 100%
					min-width 100%
					min-height 80px
					font-size 16px
					color #333
					border none
					border-bottom solid 1px #ddd
					border-radius 0

					&:disabled
						opacity 0.5

				> [ref='upload']
				> [ref='drive']
				.cat
					display inline-block
					padding 0
					margin 0
					width 48px
					height 48px
					font-size 20px
					color #657786
					background transparent
					outline none
					border none
					border-radius 0
					box-shadow none

	</style>
	<script>
		@mixin \api

		@wait = false
		@uploadings = []
		@files = []

		@on \mount ~>
			@refs.uploader.on \uploaded (file) ~>
				@add-file file

			@refs.uploader.on \change-uploads (uploads) ~>
				@trigger \change-uploading-files uploads

			@refs.text.focus!

		@onkeypress = (e) ~>
			if (e.char-code == 10 || e.char-code == 13) && e.ctrl-key
				@post!
			else
				return true

		@onpaste = (e) ~>
			data = e.clipboard-data
			items = data.items
			for i from 0 to items.length - 1
				item = items[i]
				switch (item.kind)
					| \file =>
						@upload item.get-as-file!
			return true

		@select-file = ~>
			@refs.file.click!

		@select-file-from-drive = ~>
			browser = document.body.append-child document.create-element \mk-drive-selector
			browser = riot.mount browser, do
				multiple: true
			.0
			browser.on \selected (files) ~>
				files.for-each @add-file

		@change-file = ~>
			files = @refs.file.files
			for i from 0 to files.length - 1
				file = files.item i
				@upload file

		@upload = (file) ~>
			@refs.uploader.upload file

		@add-file = (file) ~>
			file._remove = ~>
				@files = @files.filter (x) -> x.id != file.id
				@trigger \change-files @files
				@update!

			@files.push file
			@trigger \change-files @files
			@update!

		@post = ~>
			@wait = true

			files = if @files? and @files.length > 0
				then @files.map (f) -> f.id
				else undefined

			@api \posts/create do
				text: @refs.text.value
				media_ids: files
				reply_to_id: if @opts.reply? then @opts.reply.id else undefined
			.then (data) ~>
				@trigger \post
				@unmount!
			.catch (err) ~>
				console.error err
				#@opts.ui.trigger \notification 'Error!'
				@wait = false
				@update!

		@cancel = ~>
			@trigger \cancel
			@unmount!

		@cat = ~>
			@refs.text.value = @refs.text.value + '(=^・・^=)'
	</script>
</mk-post-form>
