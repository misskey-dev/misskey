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
				<input ref="accountLocation" type="text" value={ I.location }/>
			</label>
			<label>
				<p>自己紹介</p>
				<textarea ref="accountBio">{ I.bio }</textarea>
			</label>
			<label>
				<p>誕生日</p>
				<input ref="accountBirthday" type="date" value={ I.birthday }/>
			</label>
			<button class="style-primary" onclick={ updateAccount }>保存</button>
		</section>

		<section class="web" show={ page == 'web' }>
			<h1>デザイン</h1>
			<label>
				<p>壁紙</p>
				<button class="style-normal" onclick={ wallpaper }>画像を選択</button>
			</label>
		</section>

		<section class="web" show={ page == 'web' }>
			<h1>その他</h1>
			<label class="checkbox">
				<input type="checkbox" checked={ I.data.cache } onclick={ updateCache }/>
				<p>読み込みを高速化する</p>
				<p>API通信時に新鮮なユーザー情報をキャッシュすることでフェッチのオーバーヘッドを無くします。(実験的)</p>
			</label>
			<label class="checkbox">
				<input type="checkbox" checked={ I.data.debug } onclick={ updateDebug }/>
				<p>開発者モード</p>
				<p>デバッグ等の開発者モードを有効にします。</p>
			</label>
			<label class="checkbox">
				<input type="checkbox" checked={ I.data.nya } onclick={ updateNya }/>
				<p><i>な</i>を<i>にゃ</i>に変換する</p>
				<p>攻撃的な投稿が多少和らぐ可能性があります。</p>
			</label>
		</section>

		<section class="twitter" show={ page == 'twitter' }>
			<h1>Twitter</h1>
			<p>お使いのTwitterアカウントをお使いのMisskeyアカウントに接続しておくと、プロフィールでTwitterアカウント情報が表示されるようになったり、Twitterを用いた便利なサインインを利用できるようになります。<a href={ CONFIG.urls.about + '/link-to-twitter' } target="_blank">詳細...</a></p>
			<p class="account" if={ I.twitter } title={ 'Twitter ID: ' + I.twitter.user_id }>次のTwitterアカウントに接続されています: <a href={ 'https://twitter.com/' + I.twitter.screen_name } target="_blank">@{ I.twitter.screen_name }</a></p>
			<p>
				<a href={ CONFIG.api.url + '/connect/twitter' } target="_blank">{ I.twitter ? '再接続する' : 'Twitterと接続する' }</a>
				<span if={ I.twitter }> or </span>
				<a href={ CONFIG.api.url + '/disconnect/twitter' } target="_blank" if={ I.twitter }>切断する</a>
			</p>
			<p class="id" if={ I.twitter }>Twitter ID: { I.twitter.user_id }</p>
		</section>

		<section class="signin" show={ page == 'signin' }>
			<h1>ログイン履歴</h1>
			<mk-signin-history></mk-signin-history>
		</section>

		<section class="api" show={ page == 'api' }>
			<h1>API</h1>
			<p>Token:<code>{ I.token }</code></p>
			<p>APIを利用するには、上記のトークンを「i」というキーでパラメータに付加してリクエストします。</p>
			<p>アカウントを乗っ取られてしまう可能性があるため、このトークンは第三者に教えないでください(アプリなどにも入力しないでください)。</p>
			<p>万が一このトークンが漏れたりその可能性がある場合は
				<button class="regenerate" onclick={ regenerateToken }>トークンを再生成</button>できます。(副作用として、ログインしているすべてのデバイスでログアウトが発生します)
			</p>
		</section>
	</div>
	<style type="stylus">
		:scope
			display block

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
				position absolute
				top 0
				left 0
				width 200px
				height 100%
				padding 16px 0 0 0
				border-right solid 1px #ddd

				> p
					display block
					padding 10px 16px
					margin 0
					color #666
					cursor pointer

					-ms-user-select none
					-moz-user-select none
					-webkit-user-select none
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
				position absolute
				top 0
				left 200px
				width calc(100% - 200px)

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

					&.twitter
						.account
							border solid 1px #e1e8ed
							border-radius 4px
							padding 16px

							a
								font-weight bold
								color inherit

						.id
							color #8899a6

					&.api
						code
							padding 4px
							background #eee

						.regenerate
							display inline
							color $theme-color

							&:hover
								text-decoration underline

	</style>
	<script>
		@mixin \i
		@mixin \api
		@mixin \dialog
		@mixin \update-avatar
		@mixin \update-wallpaper

		@page = \account

		@set-page = (page) ~>
			@page = page

		@avatar = ~>
			@update-avatar @I, (i) ~>
				@update-i i

		@wallpaper = ~>
			@update-wallpaper @I, (i) ~>
				@update-i i

		@update-account = ~>
			@api \i/update do
				name: @refs.account-name.value
				location: @refs.account-location.value
				bio: @refs.account-bio.value
				birthday: @refs.account-birthday.value
			.then (i) ~>
				@update-i i
				alert \ok
			.catch (err) ~>
				console.error err

		@update-cache = ~>
			@I.data.cache = !@I.data.cache
			@api \i/appdata/set do
				data: JSON.stringify do
					cache: @I.data.cache
			.then ~>
				@update-i!

		@update-debug = ~>
			@I.data.debug = !@I.data.debug
			@api \i/appdata/set do
				data: JSON.stringify do
					debug: @I.data.debug
			.then ~>
				@update-i!

		@update-nya = ~>
			@I.data.nya = !@I.data.nya
			@api \i/appdata/set do
				data: JSON.stringify do
					nya: @I.data.nya
			.then ~>
				@update-i!
	</script>
</mk-settings>
