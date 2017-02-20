<mk-post-form ondragover={ ondragover } ondragenter={ ondragenter } ondragleave={ ondragleave } ondrop={ ondrop }>
	<div class="content">
		<textarea class={ with: (files.length != 0 || poll) } ref="text" disabled={ wait } oninput={ update } onkeydown={ onkeydown } onpaste={ onpaste } placeholder={ opts.reply ? 'この投稿への返信...' : 'いまどうしてる？' }></textarea>
		<div class="medias { with: poll }" if={ files.length != 0 }>
			<ul>
				<li each={ files }>
					<div class="img" style="background-image: url({ url + '?thumbnail&size=64' })" title={ name }></div><img class="remove" onclick={ _remove } src="/_/resources/desktop/remove.png" title="添付取り消し" alt=""/>
				</li>
				<li class="add" if={ files.length < 4 } title="PCからファイルを添付" onclick={ selectFile }><i class="fa fa-plus"></i></li>
			</ul>
			<p class="remain">残り{ 4 - files.length }</p>
		</div>
		<mk-poll-editor if={ poll } ref="poll" ondestroy={ onPollDestroyed }></mk-poll-editor>
	</div>
	<mk-uploader ref="uploader"></mk-uploader>
	<button ref="upload" title="PCからファイルを添付" onclick={ selectFile }><i class="fa fa-upload"></i></button>
	<button ref="drive" title="ドライブからファイルを添付" onclick={ selectFileFromDrive }><i class="fa fa-cloud"></i></button>
	<button class="cat" title="Insert The Cat" onclick={ cat }><i class="fa fa-smile-o"></i></button>
	<button class="poll" title="投票を作成" onclick={ addPoll }><i class="fa fa-pie-chart"></i></button>
	<p class="text-count { over: refs.text.value.length > 1000 }">のこり{ 1000 - refs.text.value.length }文字</p>
	<button class={ wait: wait } ref="submit" disabled={ wait || (refs.text.value.length == 0 && files.length == 0 && !poll) } onclick={ post }>{ wait ? '投稿中' : opts.reply ? '返信' : '投稿' }
		<mk-ellipsis if={ wait }></mk-ellipsis>
	</button>
	<input ref="file" type="file" accept="image/*" multiple="multiple" tabindex="-1" onchange={ changeFile }/>
	<div class="dropzone" if={ draghover }></div>
	<style>
		:scope
			display block
			padding 16px
			background lighten($theme-color, 95%)

			&:after
				content ""
				display block
				clear both

			> .content

				[ref='text']
					display block
					padding 12px
					margin 0
					width 100%
					max-width 100%
					min-width 100%
					min-height calc(16px + 12px + 12px)
					font-size 16px
					color #333
					background #fff
					outline none
					border solid 1px rgba($theme-color, 0.1)
					border-radius 4px
					transition border-color .3s ease

					&:hover
						border-color rgba($theme-color, 0.2)
						transition border-color .1s ease

						& + *
						& + * + *
							border-color rgba($theme-color, 0.2)
							transition border-color .1s ease

					&:focus
						color $theme-color
						border-color rgba($theme-color, 0.5)
						transition border-color 0s ease

						& + *
						& + * + *
							border-color rgba($theme-color, 0.5)
							transition border-color 0s ease

					&:disabled
						opacity 0.5

					&::-webkit-input-placeholder
						color rgba($theme-color, 0.3)

					&.with
						border-bottom solid 1px rgba($theme-color, 0.1) !important
						border-radius 4px 4px 0 0

				> .medias
					margin 0
					padding 0
					background lighten($theme-color, 98%)
					border solid 1px rgba($theme-color, 0.1)
					border-top none
					border-radius 0 0 4px 4px
					transition border-color .3s ease

					&.with
						border-bottom solid 1px rgba($theme-color, 0.1) !important
						border-radius 4px 4px 0 0

					> .remain
						display block
						position absolute
						top 8px
						right 8px
						margin 0
						padding 0
						color rgba($theme-color, 0.4)

					> ul
						display block
						margin 0
						padding 4px
						list-style none

						&:after
							content ""
							display block
							clear both

						> li
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

				> mk-poll-editor
					background lighten($theme-color, 98%)
					border solid 1px rgba($theme-color, 0.1)
					border-top none
					border-radius 0 0 4px 4px
					transition border-color .3s ease

			> mk-uploader
				margin 8px 0 0 0
				padding 8px
				border solid 1px rgba($theme-color, 0.2)
				border-radius 4px

			[ref='file']
				display none

			.text-count
				pointer-events none
				display block
				position absolute
				bottom 16px
				right 138px
				margin 0
				line-height 40px
				color rgba($theme-color, 0.5)

				&.over
					color #ec3828

			[ref='submit']
				display block
				position absolute
				bottom 16px
				right 16px
				cursor pointer
				padding 0
				margin 0
				width 110px
				height 40px
				font-size 1em
				color $theme-color-foreground
				background linear-gradient(to bottom, lighten($theme-color, 25%) 0%, lighten($theme-color, 10%) 100%)
				outline none
				border solid 1px lighten($theme-color, 15%)
				border-radius 4px

				&:not(:disabled)
					font-weight bold

				&:hover:not(:disabled)
					background linear-gradient(to bottom, lighten($theme-color, 8%) 0%, darken($theme-color, 8%) 100%)
					border-color $theme-color

				&:active:not(:disabled)
					background $theme-color
					border-color $theme-color

				&:focus
					&:after
						content ""
						pointer-events none
						position absolute
						top -5px
						right -5px
						bottom -5px
						left -5px
						border 2px solid rgba($theme-color, 0.3)
						border-radius 8px

				&:disabled
					opacity 0.7
					cursor default

				&.wait
					background linear-gradient(
						45deg,
						darken($theme-color, 10%) 25%,
						$theme-color              25%,
						$theme-color              50%,
						darken($theme-color, 10%) 50%,
						darken($theme-color, 10%) 75%,
						$theme-color              75%,
						$theme-color
					)
					background-size 32px 32px
					animation stripe-bg 1.5s linear infinite
					opacity 0.7
					cursor wait

					@keyframes stripe-bg
						from {background-position: 0 0;}
						to   {background-position: -64px 32px;}

			[ref='upload']
			[ref='drive']
			.cat
			.poll
				display inline-block
				cursor pointer
				padding 0
				margin 8px 4px 0 0
				width 40px
				height 40px
				font-size 1em
				color rgba($theme-color, 0.5)
				background transparent
				outline none
				border solid 1px transparent
				border-radius 4px

				&:hover
					background transparent
					border-color rgba($theme-color, 0.3)

				&:active
					color rgba($theme-color, 0.6)
					background linear-gradient(to bottom, lighten($theme-color, 80%) 0%, lighten($theme-color, 90%) 100%)
					border-color rgba($theme-color, 0.5)
					box-shadow 0 2px 4px rgba(0, 0, 0, 0.15) inset

				&:focus
					&:after
						content ""
						pointer-events none
						position absolute
						top -5px
						right -5px
						bottom -5px
						left -5px
						border 2px solid rgba($theme-color, 0.3)
						border-radius 8px

			> .dropzone
				position absolute
				left 0
				top 0
				width 100%
				height 100%
				border dashed 2px rgba($theme-color, 0.5)
				pointer-events none

	</style>
	<script>
		get-cat = require('../../common/scripts/get-cat');

		this.mixin('api');
		this.mixin('notify');
		this.mixin('autocomplete');

		this.wait = false
		this.uploadings = []
		this.files = []
		this.autocomplete = null
		this.poll = false

		this.in-reply-to-post = this.opts.reply

		// https://github.com/riot/riot/issues/2080
		if @in-reply-to-post == '' then this.in-reply-to-post = null

		this.on('mount', () => {
			this.refs.uploader.on('uploaded', (file) => {
				@add-file file

			this.refs.uploader.on('change-uploads', (uploads) => {
				this.trigger 'change-uploading-files' uploads

			this.autocomplete = new @Autocomplete this.refs.text
			@autocomplete.attach!

		this.on('unmount', () => {
			@autocomplete.detach!

		focus() {
			this.refs.text.focus();

		clear() {
			this.refs.text.value = ''
			this.files = []
			this.trigger('change-files');
			this.update();

		ondragover(e) {
			e.stopPropagation();
			this.draghover = true
			// ドラッグされてきたものがファイルだったら
			if e.dataTransfer.effect-allowed == 'all' 
				e.dataTransfer.dropEffect = 'copy' 
			else
				e.dataTransfer.dropEffect = 'move' 
			return false

		ondragenter(e) {
			this.draghover = true

		ondragleave(e) {
			this.draghover = false

		ondrop(e) {
			e.preventDefault();
			e.stopPropagation();
			this.draghover = false

			// ファイルだったら
			if e.dataTransfer.files.length > 0
				Array.prototype.for-each.call e.dataTransfer.files, (file) =>
					@upload file
				return false

			// データ取得
			data = e.dataTransfer.get-data 'text'
			if !data?
				return false

			try
				// パース
				obj = JSON.parse data

				// (ドライブの)ファイルだったら
				if obj.type == 'file' 
					@add-file obj.file
			catch
				// ignore

			return false

		onkeydown(e) {
			if (e.which == 10 || e.which == 13) && (e.ctrlKey || e.meta-key)
				@post!

		onpaste(e) {
			data = e.clipboardData
			items = data.items
			for i from 0 to items.length - 1
				item = items[i]
				switch (item.kind)
					| 'file' =>
						@upload item.getAsFile();

		select-file() {
			this.refs.file.click!

		select-file-from-drive() {
			browser = document.body.appendChild document.createElement 'mk-select-file-from-drive-window' 
			i = riot.mount browser, do
				multiple: true
			i[0].one 'selected' (files) =>
				files.for-each @add-file

		change-file() {
			files = this.refs.file.files
			for i from 0 to files.length - 1
				file = files.item i
				@upload file

		upload(file) {
			this.refs.uploader.upload file

		add-file(file) {
			file._remove = =>
				this.files = this.files.filter (x) -> x.id != file.id
				this.trigger 'change-files' this.files
				this.update();

			this.files.push file
			this.trigger 'change-files' this.files
			this.update();

		add-poll() {
			this.poll = true

		on-poll-destroyed() {
			@update do
				poll: false

		post(e) {
			this.wait = true

			files = if this.files? and this.files.length > 0
				then this.files.map (f) -> f.id
				else undefined

			this.api 'posts/create' do
				text: this.refs.text.value
				media_ids: files
				reply_to_id: if @in-reply-to-post? then @in-reply-to-post.id else undefined
				poll: if @poll then this.refs.poll.get! else undefined
			.then (data) =>
				this.trigger('post');
				@notify if @in-reply-to-post? then '返信しました！' else '投稿しました！'
			.catch (err) =>
				console.error err
				@notify '投稿できませんでした'
			.then =>
				this.wait = false
				this.update();

		cat() {
			this.refs.text.value = this.refs.text.value + get-cat!
	</script>
</mk-post-form>
