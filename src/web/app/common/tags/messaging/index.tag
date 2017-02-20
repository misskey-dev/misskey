<mk-messaging>
	<div class="search">
		<div class="form">
			<label for="search-input"><i class="fa fa-search"></i></label>
			<input ref="search" type="search" oninput={ search } onkeydown={ onSearchKeydown } placeholder="ユーザーを探す"/>
		</div>
		<div class="result">
			<ol class="users" if={ searchResult.length > 0 } ref="searchResult">
				<li each={ user, i in searchResult } onkeydown={ parent.onSearchResultKeydown.bind(null, i) } onclick={ user._click } tabindex="-1">
					<img class="avatar" src={ user.avatar_url + '?thumbnail&size=32' } alt=""/>
					<span class="name">{ user.name }</span>
					<span class="username">@{ user.username }</span>
				</li>
			</ol>
		</div>
	</div>
	<div class="history" if={ history.length > 0 }>
		<virtual each={ history }>
			<a class="user" data-is-me={ is_me } data-is-read={ is_read } onclick={ _click }>
				<div>
					<img class="avatar" src={ (is_me ? recipient.avatar_url : user.avatar_url) + '?thumbnail&size=64' } alt=""/>
					<header>
						<span class="name">{ is_me ? recipient.name : user.name }</span>
						<span class="username">{ '@' + (is_me ? recipient.username : user.username ) }</span>
						<mk-time time={ created_at }></mk-time>
					</header>
					<div class="body">
						<p class="text"><span class="me" if={ is_me }>あなた:</span>{ text }</p>
					</div>
				</div>
			</a>
		</virtual>
	</div>
	<p class="no-history" if={ history.length == 0 }>履歴はありません。<br/>ユーザーを検索して、いつでもメッセージを送受信できます。</p>
	<style>
		:scope
			display block

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

						> i
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
						padding 0 12px 0 38px
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
							background-image url("/_/resources/unread.svg")
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

			// TODO: element base media query
			@media (max-width 400px)
				> .search
					> .result
						> .users
							> li
								padding 8px 16px

				> .history
					> a
						> div
							padding 16px
							font-size 14px

							> .avatar
								margin 0 12px 0 0

	</style>
	<script>
		this.mixin('i');
		this.mixin('api');

		this.searchResult = [];

		this.on('mount', () => {
			this.api('messaging/history').then(history => {
				this.isLoading = false;
				history.forEach(message => {
					message.is_me = message.user_id == this.I.id
					message._click = () => {
						this.trigger('navigate-user', message.is_me ? message.recipient : message.user);
					};
				});
				this.history = history;
				this.update();
			});
		}

		this.search = () => {
			const q = this.refs.search.value;
			if (q == '') {
				this.searchResult = [];
			} else {
				this.api 'users/search' do
					query: q
					max: 5
				.then (users) =>
					users.for-each (user) =>
						user._click = =>
							this.trigger 'navigate-user' user
							this.search-result = []
					this.search-result = users
					this.update();
				.catch (err) =>
					console.error err

		this.on-search-keydown = (e) => {
			key = e.which
			switch (key)
				| 9, 40 => // Key[TAB] or Key[↓]
					e.preventDefault();
					e.stopPropagation();
					this.refs.search-result.childNodes[0].focus();

		this.on-search-result-keydown = (i, e) => {
			key = e.which
			switch (key)
				| 10, 13 => // Key[ENTER]
					e.preventDefault();
					e.stopPropagation();
					@search-result[i]._click!
				| 27 => // Key[ESC]
					e.preventDefault();
					e.stopPropagation();
					this.refs.search.focus();
				| 38 => // Key[↑]
					e.preventDefault();
					e.stopPropagation();
					(this.refs.search-result.childNodes[i].previous-element-sibling || this.refs.search-result.childNodes[@search-result.length - 1]).focus();
				| 9, 40 => // Key[TAB] or Key[↓]
					e.preventDefault();
					e.stopPropagation();
					(this.refs.search-result.childNodes[i].next-element-sibling || this.refs.search-result.childNodes[0]).focus();

	</script>
</mk-messaging>
