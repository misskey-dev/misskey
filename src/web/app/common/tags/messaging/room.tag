<mk-messaging-room>
	<div class="stream">
		<p class="initializing" if={ init }><i class="fa fa-spinner fa-spin"></i>読み込み中</p>
		<p class="empty" if={ !init && messages.length == 0 }><i class="fa fa-info-circle"></i>このユーザーとまだ会話したことがありません</p>
		<virtual each={ message, i in messages }>
			<mk-messaging-message message={ message }></mk-messaging-message>
			<p class="date" if={ i != messages.length - 1 && message._date != messages[i + 1]._date }><span>{ messages[i + 1]._datetext }</span></p>
		</virtual>
	</div>
	<div class="typings"></div>
	<footer>
		<div ref="notifications"></div>
		<div class="grippie" title="ドラッグしてフォームの広さを調整"></div>
		<mk-messaging-form user={ user }></mk-messaging-form>
	</footer>
	<style>
		:scope
			display block

			> .stream
				max-width 600px
				margin 0 auto

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
				position -webkit-sticky
				position sticky
				z-index 2
				bottom 0
				width 100%
				max-width 600px
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

	</style>
	<script>
		this.mixin('i');
		this.mixin('api');
		this.mixin('messaging-stream');

		this.user = this.opts.user
		this.init = true
		this.sending = false
		this.messages = []

		this.connection = new @MessagingStreamConnection this.I, @user.id

		this.on('mount', () => {
			@connection.event.on 'message' this.on-message
			@connection.event.on 'read' this.on-read

			document.add-event-listener 'visibilitychange' this.on-visibilitychange

			this.api 'messaging/messages' do
				user_id: @user.id
			.then (messages) =>
				this.init = false
				this.messages = messages.reverse!
				this.update();
				@scroll-to-bottom!
			.catch (err) =>
				console.error err

		this.on('unmount', () => {
			@connection.event.off 'message' this.on-message
			@connection.event.off 'read' this.on-read
			@connection.close!

			document.remove-event-listener 'visibilitychange' this.on-visibilitychange

		this.on('update', () => {
			@messages.for-each (message) =>
				date = (new Date message.created_at).get-date!
				month = (new Date message.created_at).get-month! + 1
				message._date = date
				message._datetext = month + '月 ' + date + '日'

		on-message(message) {
			is-bottom = @is-bottom!

			@messages.push message
			if message.user_id != this.I.id and not document.hidden
				@connection.socket.send JSON.stringify do
					type: 'read' 
					id: message.id
			this.update();

			if is-bottom
				// Scroll to bottom
				@scroll-to-bottom!
			else if message.user_id != this.I.id
				// Notify
				@notify '新しいメッセージがあります'

		on-read(ids) {
			if not Array.isArray ids then ids = [ids]
			ids.for-each (id) =>
				if (@messages.some (x) => x.id == id)
					exist = (@messages.map (x) -> x.id).index-of id
					@messages[exist].is_read = true
					this.update();

		is-bottom() {
			current = this.root.scroll-top + this.root.offset-height
			max = this.root.scroll-height
			current > (max - 32)

		scroll-to-bottom() {
			this.root.scroll-top = this.root.scroll-height

		notify(message) {
			n = document.createElement 'p' 
			n.inner-HTML = '<i class="fa fa-arrow-circle-down"></i>' + message
			n.onclick = =>
				@scroll-to-bottom!
				n.parent-node.remove-child n
			this.refs.notifications.appendChild n

			setTimeout =>
				n.style.opacity = 0
				setTimeout =>
					n.parent-node.remove-child n
				, 1000ms
			, 4000ms

		on-visibilitychange() {
			if document.hidden then return
			@messages.for-each (message) =>
				if message.user_id != this.I.id and not message.is_read
					@connection.socket.send JSON.stringify do
						type: 'read' 
						id: message.id
	</script>
</mk-messaging-room>
