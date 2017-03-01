<mk-settings>
	<div class="nav">
		<p class={ active: page == 'account' } onmousedown={ setPage.bind(null, 'account') }><i class="fa fa-fw fa-user"></i>アカウント</p>
		<p class={ active: page == 'web' } onmousedown={ setPage.bind(null, 'web') }><i class="fa fa-fw fa-desktop"></i>Web</p>
		<p class={ active: page == 'notification' } onmousedown={ setPage.bind(null, 'notification') }><i class="fa fa-fw fa-bell-o"></i>通知</p>
		<p class={ active: page == 'drive' } onmousedown={ setPage.bind(null, 'drive') }><i class="fa fa-fw fa-cloud"></i>ドライブ</p>
		<p class={ active: page == 'apps' } onmousedown={ setPage.bind(null, 'apps') }><i class="fa fa-fw fa-puzzle-piece"></i>アプリ</p>
		<p class={ active: page == 'twitter' } onmousedown={ setPage.bind(null, 'twitter') }><i class="fa fa-fw fa-twitter"></i>Twitter</p>
		<p class={ active: page == 'signin' } onmousedown={ setPage.bind(null, 'signin') }><i class="fa fa-fw fa-sign-in"></i>ログイン履歴</p>
		<p class={ active: page == 'password' } onmousedown={ setPage.bind(null, 'password') }><i class="fa fa-fw fa-unlock-alt"></i>パスワード</p>
		<p class={ active: page == 'api' } onmousedown={ setPage.bind(null, 'api') }><i class="fa fa-fw fa-key"></i>API</p>
	</div>
	<div class="pages">
		<section class="account" show={ page == 'account' }>
			<h1>アカウント</h1>
			<label class="avatar">
				<p>アバター</p><img class="avatar" src={ I.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
				<button class="style-normal" onclick={ avatar }>画像を選択</button>
			</label>
			<label>
				<p>名前</p>
				<input ref="accountName" type="text" value={ I.name }/>
			</label>
			<label>
				<p>場所</p>
				<input ref="accountLocation" type="text" value={ I.profile.location }/>
			</label>
			<label>
				<p>自己紹介</p>
				<textarea ref="accountDescription">{ I.description }</textarea>
			</label>
			<label>
				<p>誕生日</p>
				<input ref="accountBirthday" type="date" value={ I.profile.birthday }/>
			</label>
			<button class="style-primary" onclick={ updateAccount }>保存</button>
		</section>

		<section class="web" show={ page == 'web' }>
			<h1>デザイン</h1>
		</section>

		<section class="web" show={ page == 'web' }>
			<h1>その他</h1>
			<label class="checkbox">
				<input type="checkbox" checked={ I.data.cache } onclick={ updateCache }/>
				<p>読み込みを高速化する</p>
				<p>API通信時に新鮮なユーザー情報をキャッシュすることでフェッチのオーバーヘッドを無くします。(実験的)</p>
			</label>
		</section>

		<section class="apps" show={ page == 'apps' }>
			<h1>アプリケーション</h1>
			<mk-authorized-apps></mk-authorized-apps>
		</section>

		<section class="twitter" show={ page == 'twitter' }>
			<h1>Twitter</h1>
			<mk-twitter-setting></mk-twitter-setting>
		</section>

		<section class="signin" show={ page == 'signin' }>
			<h1>ログイン履歴</h1>
			<mk-signin-history></mk-signin-history>
		</section>

		<section class="api" show={ page == 'api' }>
			<h1>API</h1>
			<mk-api-info></mk-api-info>
		</section>
	</div>
	<style>
		:scope
			display flex
			width 100%
			height 100%

			input:not([type])
			input[type='text']
			input[type='password']
			input[type='email']
			textarea
				padding 8px
				width 100%
				font-size 16px
				color #55595c
				border solid 1px #dadada
				border-radius 4px

				&:hover
					border-color #aeaeae

				&:focus
					border-color #aeaeae

			> .nav
				flex 0 0 200px
				width 100%
				height 100%
				padding 16px 0 0 0
				overflow auto
				border-right solid 1px #ddd

				> p
					display block
					padding 10px 16px
					margin 0
					color #666
					cursor pointer
					user-select none
					transition margin-left 0.2s ease

					> i
						margin-right 4px

					&:hover
						color #555

					&.active
						margin-left 8px
						color $theme-color !important

			> .pages
				width 100%
				height 100%
				flex auto
				overflow auto

				> section
					padding 32px

					//	& + section
					//		margin-top 16px

					h1
						display block
						margin 0
						padding 0 0 8px 0
						font-size 1em
						color #555
						border-bottom solid 1px #eee

					label
						display block
						margin 16px 0

						&:after
							content ""
							display block
							clear both

						> p
							margin 0 0 8px 0
							font-weight bold
							color #373a3c

						&.checkbox
							> input
								position absolute
								top 0
								left 0

								&:checked + p
									color $theme-color

							> p
								width calc(100% - 32px)
								margin 0 0 0 32px
								font-weight bold

								&:last-child
									font-weight normal
									color #999

					&.account
						> .general
							> .avatar
								> img
									display block
									float left
									width 64px
									height 64px
									border-radius 4px

								> button
									float left
									margin-left 8px

	</style>
	<script>
		this.mixin('i');
		this.mixin('api');
		this.mixin('notify');
		this.mixin('dialog');
		this.mixin('update-avatar');

		this.page = 'account';

		this.setPage = page => {
			this.page = page;
		};

		this.avatar = () => {
			this.updateAvatar(this.I);
		};

		this.updateAccount = () => {
			this.api('i/update', {
				name: this.refs.accountName.value,
				location: this.refs.accountLocation.value || undefined,
				description: this.refs.accountDescription.value || undefined,
				birthday: this.refs.accountBirthday.value || undefined
			}).then(() => {
				this.notify('プロフィールを更新しました');
			});
		};

		this.updateCache = () => {
			this.I.data.cache = !this.I.data.cache;
			this.api('i/appdata/set', {
				data: JSON.stringify({
					cache: this.I.data.cache
				})
			});
		};
	</script>
</mk-settings>
