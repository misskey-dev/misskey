mk-messaging-form
	textarea@text(onkeypress={ onkeypress }, onpaste={ onpaste }, placeholder='ここにメッセージを入力')
	div.files
	mk-uploader@uploader
	button.send(onclick={ send }, disabled={ sending }, title='メッセージを送信')
		i.fa.fa-paper-plane(if={ !sending })
		i.fa.fa-spinner.fa-spin(if={ sending })
	button.attach-from-local(type='button', title='PCから画像を添付する')
		i.fa.fa-upload
	button.attach-from-drive(type='button', title='アルバムから画像を添付する')
		i.fa.fa-folder-open
	input(name='file', type='file', accept='image/*')

style.
	display block

	> textarea
		cursor auto
		display block
		width 100%
		min-width 100%
		max-width 100%
		height 64px
		margin 0
		padding 8px
		font-size 1em
		color #000
		outline none
		border none
		border-top solid 1px #eee
		border-radius 0
		box-shadow none
		background transparent

	> .send
		position absolute
		bottom 0
		right 0
		margin 0
		padding 10px 14px
		line-height 1em
		font-size 1em
		color #aaa
		transition color 0.1s ease

		&:hover
			color $theme-color

		&:active
			color darken($theme-color, 10%)
			transition color 0s ease

	.files
		display block
		margin 0
		padding 0 8px
		list-style none

		&:after
			content ''
			display block
			clear both

		> li
			display block
			float left
			margin 4px
			padding 0
			width 64px
			height 64px
			background-color #eee
			background-repeat no-repeat
			background-position center center
			background-size cover
			cursor move

			&:hover
				> .remove
					display block

			> .remove
				display none
				position absolute
				right -6px
				top -6px
				margin 0
				padding 0
				background transparent
				outline none
				border none
				border-radius 0
				box-shadow none
				cursor pointer

	.attach-from-local
	.attach-from-drive
		margin 0
		padding 10px 14px
		line-height 1em
		font-size 1em
		font-weight normal
		text-decoration none
		color #aaa
		transition color 0.1s ease

		&:hover
			color $theme-color

		&:active
			color darken($theme-color, 10%)
			transition color 0s ease

	input[type=file]
		display none

script.
	@mixin \api

	@user = @opts.user

	@onpaste = (e) ~>
		data = e.clipboard-data
		items = data.items
		for i from 0 to items.length - 1
			item = items[i]
			switch (item.kind)
				| \file =>
					@upload item.get-as-file!

	@onkeypress = (e) ~>
		if (e.which == 10 || e.which == 13) && e.ctrl-key
			@send!

	@select-file = ~>
		@refs.file.click!

	@select-file-from-drive = ~>
		browser = document.body.append-child document.create-element \mk-select-file-from-drive-window
		event = riot.observable!
		riot.mount browser, do
			multiple: true
			event: event
		event.one \selected (files) ~>
			files.for-each @add-file

	@send = ~>
		@sending = true
		@api \messaging/messages/create do
			user_id: @user.id
			text: @refs.text.value
		.then (message) ~>
			@clear!
		.catch (err) ~>
			console.error err
		.then ~>
			@sending = false
			@update!

	@clear = ~>
		@refs.text.value = ''
		@files = []
		@update!
