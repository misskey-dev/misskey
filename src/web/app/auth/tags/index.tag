<mk-index>
	<main if={ SIGNIN }>
		<p class="fetching" if={ fetching }>読み込み中<mk-ellipsis/></p>
		<mk-form ref="form" if={ state == 'waiting' } session={ session }/>
		<div class="denied" if={ state == 'denied' }>
			<h1>アプリケーションの連携をキャンセルしました。</h1>
			<p>このアプリがあなたのアカウントにアクセスすることはありません。</p>
		</div>
		<div class="accepted" if={ state == 'accepted' }>
			<h1>{ session.app.is_authorized ? 'このアプリは既に連携済みです' : 'アプリケーションの連携を許可しました'}</h1>
			<p if={ session.app.callback_url }>アプリケーションに戻っています<mk-ellipsis/></p>
			<p if={ !session.app.callback_url }>アプリケーションに戻って、やっていってください。</p>
		</div>
		<div class="error" if={ state == 'fetch-session-error' }>
			<p>セッションが存在しません。</p>
		</div>
	</main>
	<main class="signin" if={ !SIGNIN }>
		<h1>サインインしてください</h1>
		<mk-signin/>
	</main>
	<footer><img src="/assets/auth/logo.svg" alt="Misskey"/></footer>
	<style lang="stylus" scoped>
		:scope
			display block

			> main
				width 100%
				max-width 500px
				margin 0 auto
				text-align center
				background #fff
				box-shadow 0px 4px 16px rgba(0, 0, 0, 0.2)

				> .fetching
					margin 0
					padding 32px
					color #555

				> div
					padding 64px

					> h1
						margin 0 0 8px 0
						padding 0
						font-size 20px
						font-weight normal

					> p
						margin 0
						color #555

					&.denied > h1
						color #e65050

					&.accepted > h1
						color #54af7c

				&.signin
					padding 32px 32px 16px 32px

					> h1
						margin 0 0 22px 0
						padding 0
						font-size 20px
						font-weight normal
						color #555

				@media (max-width 600px)
					max-width none
					box-shadow none

				@media (max-width 500px)
					> div
						> h1
							font-size 16px

			> footer
				> img
					display block
					width 64px
					height 64px
					margin 0 auto

	</style>
	<script>
		this.mixin('i');
		this.mixin('api');

		this.state = null;
		this.fetching = true;

		this.token = window.location.href.split('/').pop();

		this.on('mount', () => {
			if (!this.SIGNIN) return;

			// Fetch session
			this.api('auth/session/show', {
				token: this.token
			}).then(session => {
				this.session = session;
				this.fetching = false;

				// 既に連携していた場合
				if (this.session.app.is_authorized) {
					this.api('auth/accept', {
						token: this.session.token
					}).then(() => {
						this.accepted();
					});
				} else {
					this.update({
						state: 'waiting'
					});

					this.$refs.form.on('denied', () => {
						this.update({
							state: 'denied'
						});
					});

					this.$refs.form.on('accepted', this.accepted);
				}
			}).catch(error => {
				this.update({
					fetching: false,
					state: 'fetch-session-error'
				});
			});
		});

		this.accepted = () => {
			this.update({
				state: 'accepted'
			});

			if (this.session.app.callback_url) {
				location.href = this.session.app.callback_url + '?token=' + this.session.token;
			}
		};
	</script>
</mk-index>
