<mk-messaging data-compact={ opts.compact }>
	<div class="search" if={ !opts.compact }>
		<div class="form">
			<label for="search-input">%fa:search%</label>
			<input ref="search" type="search" oninput={ search } onkeydown={ onSearchKeydown } placeholder="%i18n:common.tags.mk-messaging.search-user%"/>
		</div>
		<div class="result">
			<ol class="users" if={ searchResult.length > 0 } ref="searchResult">
				<li each={ user, i in searchResult } onkeydown={ parent.onSearchResultKeydown.bind(null, i) } @click="user._click" tabindex="-1">
					<img class="avatar" src={ user.avatar_url + '?thumbnail&size=32' } alt=""/>
					<span class="name">{ user.name }</span>
					<span class="username">@{ user.username }</span>
				</li>
			</ol>
		</div>
	</div>
	<div class="history" if={ history.length > 0 }>
		<virtual each={ history }>
			<a class="user" data-is-me={ is_me } data-is-read={ is_read } @click="_click">
				<div>
					<img class="avatar" src={ (is_me ? recipient.avatar_url : user.avatar_url) + '?thumbnail&size=64' } alt=""/>
					<header>
						<span class="name">{ is_me ? recipient.name : user.name }</span>
						<span class="username">{ '@' + (is_me ? recipient.username : user.username ) }</span>
						<mk-time time={ created_at }/>
					</header>
					<div class="body">
						<p class="text"><span class="me" if={ is_me }>%i18n:common.tags.mk-messaging.you%:</span>{ text }</p>
					</div>
				</div>
			</a>
		</virtual>
	</div>
	<p class="no-history" if={ !fetching && history.length == 0 }>%i18n:common.tags.mk-messaging.no-history%</p>
	<p class="fetching" if={ fetching }>%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
	<style>
		:scope
			display block

			&[data-compact]
				font-size 0.8em

				> .history
					> a
						&:last-child
							border-bottom none

						&:not([data-is-me]):not([data-is-read])
							> div
								background-image none
								border-left solid 4px #3aa2dc

						> div
							padding 16px

							> header
								> mk-time
									font-size 1em

							> .avatar
								width 42px
								height 42px
								margin 0 12px 0 0

			> .search
				display block
				position -webkit-sticky
				position sticky
				top 0
				left 0
				z-index 1
				width 100%
				background #fff
				box-shadow 0 0px 2px rgba(0, 0, 0, 0.2)

				> .form
					padding 8px
					background #f7f7f7

					> label
						display block
						position absolute
						top 0
						left 8px
						z-index 1
						height 100%
						width 38px
						pointer-events none

						> [data-fa]
							display block
							position absolute
							top 0
							right 0
							bottom 0
							left 0
							width 1em
							height 1em
							margin auto
							color #555

					> input
						margin 0
						padding 0 0 0 38px
						width 100%
						font-size 1em
						line-height 38px
						color #000
						outline none
						border solid 1px #eee
						border-radius 5px
						box-shadow none
						transition color 0.5s ease, border 0.5s ease

						&:hover
							border solid 1px #ddd
							transition border 0.2s ease

						&:focus
							color darken($theme-color, 20%)
							border solid 1px $theme-color
							transition color 0, border 0

				> .result
					display block
					top 0
					left 0
					z-index 2
					width 100%
					margin 0
					padding 0
					background #fff

					> .users
						margin 0
						padding 0
						list-style none

						> li
							display inline-block
							z-index 1
							width 100%
							padding 8px 32px
							vertical-align top
							white-space nowrap
							overflow hidden
							color rgba(0, 0, 0, 0.8)
							text-decoration none
							transition none
							cursor pointer

							&:hover
							&:focus
								color #fff
								background $theme-color

								.name
									color #fff

								.username
									color #fff

							&:active
								color #fff
								background darken($theme-color, 10%)

								.name
									color #fff

								.username
									color #fff

							.avatar
								vertical-align middle
								min-width 32px
								min-height 32px
								max-width 32px
								max-height 32px
								margin 0 8px 0 0
								border-radius 6px

							.name
								margin 0 8px 0 0
								/*font-weight bold*/
								font-weight normal
								color rgba(0, 0, 0, 0.8)

							.username
								font-weight normal
								color rgba(0, 0, 0, 0.3)

			> .history

				> a
					display block
					text-decoration none
					background #fff
					border-bottom solid 1px #eee

					*
						pointer-events none
						user-select none

					&:hover
						background #fafafa

						> .avatar
							filter saturate(200%)

					&:active
						background #eee

					&[data-is-read]
					&[data-is-me]
						opacity 0.8

					&:not([data-is-me]):not([data-is-read])
						> div
							background-image url("/assets/unread.svg")
							background-repeat no-repeat
							background-position 0 center

					&:after
						content ""
						display block
						clear both

					> div
						max-width 500px
						margin 0 auto
						padding 20px 30px

						&:after
							content ""
							display block
							clear both

						> header
							margin-bottom 2px
							white-space nowrap
							overflow hidden

							> .name
								text-align left
								display inline
								margin 0
								padding 0
								font-size 1em
								color rgba(0, 0, 0, 0.9)
								font-weight bold
								transition all 0.1s ease

							> .username
								text-align left
								margin 0 0 0 8px
								color rgba(0, 0, 0, 0.5)

							> mk-time
								position absolute
								top 0
								right 0
								display inline
								color rgba(0, 0, 0, 0.5)
								font-size 80%

						> .avatar
							float left
							width 54px
							height 54px
							margin 0 16px 0 0
							border-radius 8px
							transition all 0.1s ease

						> .body

							> .text
								display block
								margin 0 0 0 0
								padding 0
								overflow hidden
								overflow-wrap break-word
								font-size 1.1em
								color rgba(0, 0, 0, 0.8)

								.me
									color rgba(0, 0, 0, 0.4)

							> .image
								display block
								max-width 100%
								max-height 512px

			> .no-history
				margin 0
				padding 2em 1em
				text-align center
				color #999
				font-weight 500

			> .fetching
				margin 0
				padding 16px
				text-align center
				color #aaa

				> [data-fa]
					margin-right 4px

			// TODO: element base media query
			@media (max-width 400px)
				> .search
					> .result
						> .users
							> li
								padding 8px 16px

				> .history
					> a
						&:not([data-is-me]):not([data-is-read])
							> div
								background-image none
								border-left solid 4px #3aa2dc

						> div
							padding 16px
							font-size 14px

							> .avatar
								margin 0 12px 0 0

	</style>
	<script>
		this.mixin('i');
		this.mixin('api');

		this.mixin('messaging-index-stream');
		this.connection = this.messagingIndexStream.getConnection();
		this.connectionId = this.messagingIndexStream.use();

		this.searchResult = [];
		this.history = [];
		this.fetching = true;

		this.registerMessage = message => {
			message.is_me = message.user_id == this.I.id;
			message._click = () => {
				this.trigger('navigate-user', message.is_me ? message.recipient : message.user);
			};
		};

		this.on('mount', () => {
			this.connection.on('message', this.onMessage);
			this.connection.on('read', this.onRead);

			this.api('messaging/history').then(history => {
				this.fetching = false;
				history.forEach(message => {
					this.registerMessage(message);
				});
				this.history = history;
				this.update();
			});
		});

		this.on('unmount', () => {
			this.connection.off('message', this.onMessage);
			this.connection.off('read', this.onRead);
			this.messagingIndexStream.dispose(this.connectionId);
		});

		this.onMessage = message => {
			this.history = this.history.filter(m => !(
				(m.recipient_id == message.recipient_id && m.user_id == message.user_id) ||
				(m.recipient_id == message.user_id && m.user_id == message.recipient_id)));

			this.registerMessage(message);

			this.history.unshift(message);
			this.update();
		};

		this.onRead = ids => {
			ids.forEach(id => {
				const found = this.history.find(m => m.id == id);
				if (found) found.is_read = true;
			});

			this.update();
		};

		this.search = () => {
			const q = this.$refs.search.value;
			if (q == '') {
				this.searchResult = [];
				return;
			}
			this.api('users/search', {
				query: q,
				max: 5
			}).then(users => {
				users.forEach(user => {
					user._click = () => {
						this.trigger('navigate-user', user);
						this.searchResult = [];
					};
				});
				this.update({
					searchResult: users
				});
			});
		};

		this.onSearchKeydown = e => {
			switch (e.which) {
				case 9: // [TAB]
				case 40: // [↓]
					e.preventDefault();
					e.stopPropagation();
					this.$refs.searchResult.childNodes[0].focus();
					break;
			}
		};

		this.onSearchResultKeydown = (i, e) => {
			const cancel = () => {
				e.preventDefault();
				e.stopPropagation();
			};
			switch (true) {
				case e.which == 10: // [ENTER]
				case e.which == 13: // [ENTER]
					cancel();
					this.searchResult[i]._click();
					break;

				case e.which == 27: // [ESC]
					cancel();
					this.$refs.search.focus();
					break;

				case e.which == 9 && e.shiftKey: // [TAB] + [Shift]
				case e.which == 38: // [↑]
					cancel();
					(this.$refs.searchResult.childNodes[i].previousElementSibling || this.$refs.searchResult.childNodes[this.searchResult.length - 1]).focus();
					break;

				case e.which == 9: // [TAB]
				case e.which == 40: // [↓]
					cancel();
					(this.$refs.searchResult.childNodes[i].nextElementSibling || this.$refs.searchResult.childNodes[0]).focus();
					break;
			}
		};

	</script>
</mk-messaging>
