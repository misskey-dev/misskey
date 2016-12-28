mk-messaging-room
	div.stream@stream
		p.initializing(if={ init })
			i.fa.fa-spinner.fa-spin
			| 読み込み中
		p.empty(if={ !init && messages.length == 0 })
			i.fa.fa-info-circle
			| このユーザーとまだ会話したことがありません
		virtual(each={ message, i in messages })
			mk-messaging-message(message={ message })
			p.date(if={ i != messages.length - 1 && message._date != messages[i + 1]._date })
				span { messages[i + 1]._datetext }

	div.typings
	footer
		div@notifications
		div.grippie(title='ドラッグしてフォームの広さを調整')
		mk-messaging-form(user={ user })

style.
	display block

	> .stream
		position absolute
		top 0
		left 0
		width 100%
		height calc(100% - 100px)
		overflow auto

		> .empty
			width 100%
			margin 0
			padding 16px 8px 8px 8px
			text-align center
			font-size 0.8em
			color rgba(0, 0, 0, 0.4)

			i
				margin-right 4px

		> .no-history
			display block
			margin 0
			padding 16px
			text-align center
			font-size 0.8em
			color rgba(0, 0, 0, 0.4)

			i
				margin-right 4px

		> .message
			// something

		> .date
			display block
			margin 8px 0
			text-align center

			&:before
				content ''
				display block
				position absolute
				height 1px
				width 90%
				top 16px
				left 0
				right 0
				margin 0 auto
				background rgba(0, 0, 0, 0.1)

			> span
				display inline-block
				margin 0
				padding 0 16px
				//font-weight bold
				line-height 32px
				color rgba(0, 0, 0, 0.3)
				background #fff

	> footer
		position absolute
		z-index 2
		bottom 0
		width 600px
		max-width 100%
		margin 0 auto
		padding 0
		background rgba(255, 255, 255, 0.95)
		background-clip content-box

		> [ref='notifications']
			position absolute
			top -48px
			width 100%
			padding 8px 0
			text-align center

			> p
				display inline-block
				margin 0
				padding 0 12px 0 28px
				cursor pointer
				line-height 32px
				font-size 12px
				color $theme-color-foreground
				background $theme-color
				border-radius 16px
				transition opacity 1s ease

				> i
					position absolute
					top 0
					left 10px
					line-height 32px
					font-size 16px

		> .grippie
			height 10px
			margin-top -10px
			background transparent
			cursor ns-resize

			&:hover
				//background rgba(0, 0, 0, 0.1)

			&:active
				//background rgba(0, 0, 0, 0.2)

script.
	@mixin \i
	@mixin \api
	@mixin \messaging-stream

	@user = @opts.user
	@init = true
	@sending = false
	@messages = []

	@connection = new @MessagingStreamConnection @I, @user.id

	@on \mount ~>
		@connection.event.on \message @on-message
		@connection.event.on \read @on-read

		document.add-event-listener \visibilitychange @on-visibilitychange

		@api \messaging/messages do
			user_id: @user.id
		.then (messages) ~>
			@init = false
			@messages = messages.reverse!
			@update!
			@scroll-to-bottom!
		.catch (err) ~>
			console.error err

	@on \unmount ~>
		@connection.event.off \message @on-message
		@connection.event.off \read @on-read
		@connection.close!

		document.remove-event-listener \visibilitychange @on-visibilitychange

	@on \update ~>
		@messages.for-each (message) ~>
			date = (new Date message.created_at).get-date!
			month = (new Date message.created_at).get-month! + 1
			message._date = date
			message._datetext = month + '月 ' + date + '日'

	@on-message = (message) ~>
		is-bottom = @is-bottom!

		@messages.push message
		if message.user_id != @I.id and not document.hidden
			@connection.socket.send JSON.stringify do
				type: \read
				id: message.id
		@update!

		if is-bottom
			# Scroll to bottom
			@scroll-to-bottom!
		else if message.user_id != @I.id
			# Notify
			@notify '新しいメッセージがあります'

	@on-read = (ids) ~>
		if not Array.isArray ids then ids = [ids]
		ids.for-each (id) ~>
			if (@messages.some (x) ~> x.id == id)
				exist = (@messages.map (x) -> x.id).index-of id
				@messages[exist].is_read = true
				@update!

	@is-bottom = ~>
		current = @refs.stream.scroll-top + @refs.stream.offset-height
		max = @refs.stream.scroll-height
		current > (max - 32)

	@scroll-to-bottom = ~>
		@refs.stream.scroll-top = @refs.stream.scroll-height

	@notify = (message) ~>
		n = document.create-element \p
		n.inner-HTML = '<i class="fa fa-arrow-circle-down"></i>' + message
		n.onclick = ~>
			@scroll-to-bottom!
			n.parent-node.remove-child n
		@refs.notifications.append-child n

		set-timeout ~>
			n.style.opacity = 0
			set-timeout ~>
				n.parent-node.remove-child n
			, 1000ms
		, 4000ms

	@on-visibilitychange = ~>
		if document.hidden then return
		@messages.for-each (message) ~>
			if message.user_id != @I.id and not message.is_read
				@connection.socket.send JSON.stringify do
					type: \read
					id: message.id
