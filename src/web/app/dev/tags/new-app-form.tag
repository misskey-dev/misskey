mk-new-app-form
	form(onsubmit={ onsubmit }, autocomplete='off')
		section.name: label
			p.caption
				| アプリケーション名
			input@name(
				type='text'
				placeholder='ex) Misskey for iOS'
				autocomplete='off'
				required)

		section.nid: label
			p.caption
				| Named ID
			input@nid(
				type='text'
				pattern='^[a-zA-Z0-9\-]{3,30}$'
				placeholder='ex) misskey-for-ios'
				autocomplete='off'
				required
				onkeyup={ on-change-nid })

			p.info(if={ nid-state == 'wait' }, style='color:#999')
				i.fa.fa-fw.fa-spinner.fa-pulse
				| 確認しています...
			p.info(if={ nid-state == 'ok' }, style='color:#3CB7B5')
				i.fa.fa-fw.fa-check
				| 利用できます
			p.info(if={ nid-state == 'unavailable' }, style='color:#FF1161')
				i.fa.fa-fw.fa-exclamation-triangle
				| 既に利用されています
			p.info(if={ nid-state == 'error' }, style='color:#FF1161')
				i.fa.fa-fw.fa-exclamation-triangle
				| 通信エラー
			p.info(if={ nid-state == 'invalid-format' }, style='color:#FF1161')
				i.fa.fa-fw.fa-exclamation-triangle
				| a~z、A~Z、0~9、-(ハイフン)が使えます
			p.info(if={ nid-state == 'min-range' }, style='color:#FF1161')
				i.fa.fa-fw.fa-exclamation-triangle
				| 3文字以上でお願いします！
			p.info(if={ nid-state == 'max-range' }, style='color:#FF1161')
				i.fa.fa-fw.fa-exclamation-triangle
				| 30文字以内でお願いします

		section.description: label
			p.caption
				| アプリの概要
			textarea@description(
				placeholder='ex) Misskey iOSクライアント。'
				autocomplete='off'
				required)

		section.callback: label
			p.caption
				| コールバックURL (オプション)
			input@cb(
				type='url'
				placeholder='ex) https://your.app.example.com/callback.php'
				autocomplete='off')

		section.permission
			p.caption
				| 権限
			div@permission
				label
					input(type='checkbox', value='account-read')
					p アカウントの情報を見る。
				label
					input(type='checkbox', value='account-write')
					p アカウントの情報を操作する。
				label
					input(type='checkbox', value='post-write')
					p 投稿する。
				label
					input(type='checkbox', value='like-write')
					p いいねしたりいいね解除する。
				label
					input(type='checkbox', value='following-write')
					p フォローしたりフォロー解除する。
				label
					input(type='checkbox', value='drive-read')
					p ドライブを見る。
				label
					input(type='checkbox', value='drive-write')
					p ドライブを操作する。
				label
					input(type='checkbox', value='notification-read')
					p 通知を見る。
				label
					input(type='checkbox', value='notification-write')
					p 通知を操作する。
			p
				i.fa.fa-exclamation-triangle
				| アプリ作成後も変更できますが、新たな権限を付与する場合、その時点で関連付けられているユーザーキーはすべて無効になります。

		button(onclick={ onsubmit })
			| アプリ作成

style.
	display block
	overflow hidden

	> form

		section
			display block
			margin 16px 0

			.caption
				margin 0 0 4px 0
				color #616161
				font-size 0.95em

				> i
					margin-right 0.25em
					color #96adac

			.info
				display block
				margin 4px 0
				font-size 0.8em

				> i
					margin-right 0.3em

		section.permission
			div
				padding 8px 0
				max-height 160px
				overflow auto
				background #fff
				border solid 1px #cecece
				border-radius 4px

			label
				display block
				padding 0 12px
				line-height 32px
				cursor pointer

				&:hover
					> p
						color #999

					[type='checkbox']:checked + p
						color #000

				[type='checkbox']
					margin-right 4px

				[type='checkbox']:checked + p
					color #111

				> p
					display inline
					color #aaa
					user-select none

			> p:last-child
				margin 6px
				font-size 0.8em
				color #999

				> i
					margin-right 4px

		[type=text]
		[type=url]
		textarea
			user-select text
			display inline-block
			cursor auto
			padding 8px 12px
			margin 0
			width 100%
			font-size 1em
			color #333
			background #fff
			outline none
			border solid 1px #cecece
			border-radius 4px

			&:hover
				border-color #bbb

			&:focus
				border-color $theme-color

			&:disabled
				opacity 0.5

		> button
			margin 20px 0 32px 0
			width 100%
			font-size 1em
			color #111
			border-radius 3px

script.
	@mixin \api

	@nid-state = null

	@on-change-nid = ~>
		nid = @refs.nid.value

		if nid == ''
			@nid-state = null
			@update!
			return

		err = switch
			| not nid.match /^[a-zA-Z0-9\-]+$/ => \invalid-format
			| nid.length < 3chars              => \min-range
			| nid.length > 30chars             => \max-range
			| _                                     => null

		if err?
			@nid-state = err
			@update!
		else
			@nid-state = \wait
			@update!

			@api \app/name_id/available do
				name_id: nid
			.then (result) ~>
				if result.available
					@nid-state = \ok
				else
					@nid-state = \unavailable
				@update!
			.catch (err) ~>
				@nid-state = \error
				@update!

	@onsubmit = ~>
		name = @refs.name.value
		nid = @refs.nid.value
		description = @refs.description.value
		cb = @refs.cb.value
		permission = []

		@refs.permission.query-selector-all \input .for-each (el) ~>
			if el.checked then permission.push el.value

		locker = document.body.append-child document.create-element \mk-locker

		@api \app/create do
			name: name
			name_id: nid
			description: description
			callback_url: cb
			permission: permission.join \,
		.then ~>
			location.href = '/apps'
		.catch ~>
			alert 'アプリの作成に失敗しました。再度お試しください。'

			locker.parent-node.remove-child locker
