<mk-messaging-room>
	<div class="stream">
		<p class="init" if={ init }>%fa:spinner .spin%%i18n:common.loading%</p>
		<p class="empty" if={ !init && messages.length == 0 }>%fa:info-circle%%i18n:common.tags.mk-messaging-room.empty%</p>
		<p class="no-history" if={ !init && messages.length > 0 && !moreMessagesIsInStock }>%fa:flag%%i18n:common.tags.mk-messaging-room.no-history%</p>
		<button class="more { fetching: fetchingMoreMessages }" if={ moreMessagesIsInStock } @click="fetchMoreMessages" disabled={ fetchingMoreMessages }>
			<virtual if={ fetchingMoreMessages }>%fa:spinner .pulse .fw%</virtual>{ fetchingMoreMessages ? '%i18n:common.loading%' : '%i18n:common.tags.mk-messaging-room.more%' }
		</button>
		<virtual each={ message, i in messages }>
			<mk-messaging-message message={ message }/>
			<p class="date" if={ i != messages.length - 1 && message._date != messages[i + 1]._date }><span>{ messages[i + 1]._datetext }</span></p>
		</virtual>
	</div>
	<footer>
		<div ref="notifications"></div>
		<div class="grippie" title="%i18n:common.tags.mk-messaging-room.resize-form%"></div>
		<mk-messaging-form user={ user }/>
	</footer>
	<style>
		:scope
			display block

			> .stream
				max-width 600px
				margin 0 auto

				> .init
					width 100%
					margin 0
					padding 16px 8px 8px 8px
					text-align center
					font-size 0.8em
					color rgba(0, 0, 0, 0.4)

					[data-fa]
						margin-right 4px

				> .empty
					width 100%
					margin 0
					padding 16px 8px 8px 8px
					text-align center
					font-size 0.8em
					color rgba(0, 0, 0, 0.4)

					[data-fa]
						margin-right 4px

				> .no-history
					display block
					margin 0
					padding 16px
					text-align center
					font-size 0.8em
					color rgba(0, 0, 0, 0.4)

					[data-fa]
						margin-right 4px

				> .more
					display block
					margin 16px auto
					padding 0 12px
					line-height 24px
					color #fff
					background rgba(0, 0, 0, 0.3)
					border-radius 12px

					&:hover
						background rgba(0, 0, 0, 0.4)

					&:active
						background rgba(0, 0, 0, 0.5)

					&.fetching
						cursor wait

					> [data-fa]
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

					&:empty
						display none

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

						> [data-fa]
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
		import MessagingStreamConnection from '../../scripts/streaming/messaging-stream';

		this.mixin('i');
		this.mixin('api');

		this.user = this.opts.user;
		this.init = true;
		this.sending = false;
		this.messages = [];
		this.isNaked = this.opts.isNaked;

		this.connection = new MessagingStreamConnection(this.I, this.user.id);

		this.on('mount', () => {
			this.connection.on('message', this.onMessage);
			this.connection.on('read', this.onRead);

			document.addEventListener('visibilitychange', this.onVisibilitychange);

			this.fetchMessages().then(() => {
				this.init = false;
				this.update();
				this.scrollToBottom();
			});
		});

		this.on('unmount', () => {
			this.connection.off('message', this.onMessage);
			this.connection.off('read', this.onRead);
			this.connection.close();

			document.removeEventListener('visibilitychange', this.onVisibilitychange);
		});

		this.on('update', () => {
			this.messages.forEach(message => {
				const date = (new Date(message.created_at)).getDate();
				const month = (new Date(message.created_at)).getMonth() + 1;
				message._date = date;
				message._datetext = month + '月 ' + date + '日';
			});
		});

		this.onMessage = (message) => {
			const isBottom = this.isBottom();

			this.messages.push(message);
			if (message.user_id != this.I.id && !document.hidden) {
				this.connection.send({
					type: 'read',
					id: message.id
				});
			}
			this.update();

			if (isBottom) {
				// Scroll to bottom
				this.scrollToBottom();
			} else if (message.user_id != this.I.id) {
				// Notify
				this.notify('%i18n:common.tags.mk-messaging-room.new-message%');
			}
		};

		this.onRead = ids => {
			if (!Array.isArray(ids)) ids = [ids];
			ids.forEach(id => {
				if (this.messages.some(x => x.id == id)) {
					const exist = this.messages.map(x => x.id).indexOf(id);
					this.messages[exist].is_read = true;
					this.update();
				}
			});
		};

		this.fetchMoreMessages = () => {
			this.update({
				fetchingMoreMessages: true
			});
			this.fetchMessages().then(() => {
				this.update({
					fetchingMoreMessages: false
				});
			});
		};

		this.fetchMessages = () => new Promise((resolve, reject) => {
			const max = this.moreMessagesIsInStock ? 20 : 10;

			this.api('messaging/messages', {
				user_id: this.user.id,
				limit: max + 1,
				until_id: this.moreMessagesIsInStock ? this.messages[0].id : undefined
			}).then(messages => {
				if (messages.length == max + 1) {
					this.moreMessagesIsInStock = true;
					messages.pop();
				} else {
					this.moreMessagesIsInStock = false;
				}

				this.messages.unshift.apply(this.messages, messages.reverse());
				this.update();

				resolve();
			});
		});

		this.isBottom = () => {
			const asobi = 32;
			const current = this.isNaked
				? window.scrollY + window.innerHeight
				: this.root.scrollTop + this.root.offsetHeight;
			const max = this.isNaked
				? document.body.offsetHeight
				: this.root.scrollHeight;
			return current > (max - asobi);
		};

		this.scrollToBottom = () => {
			if (this.isNaked) {
				window.scroll(0, document.body.offsetHeight);
			} else {
				this.root.scrollTop = this.root.scrollHeight;
			}
		};

		this.notify = message => {
			const n = document.createElement('p');
			n.innerHTML = '%fa:arrow-circle-down%' + message;
			n.onclick = () => {
				this.scrollToBottom();
				n.parentNode.removeChild(n);
			};
			this.$refs.notifications.appendChild(n);

			setTimeout(() => {
				n.style.opacity = 0;
				setTimeout(() => n.parentNode.removeChild(n), 1000);
			}, 4000);
		};

		this.onVisibilitychange = () => {
			if (document.hidden) return;
			this.messages.forEach(message => {
				if (message.user_id !== this.I.id && !message.is_read) {
					this.connection.send({
						type: 'read',
						id: message.id
					});
				}
			});
		};
	</script>
</mk-messaging-room>
