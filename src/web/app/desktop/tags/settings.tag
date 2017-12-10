<mk-settings>
	<div class="nav">
		<p class={ active: page == 'profile' } onmousedown={ setPage.bind(null, 'profile') }>%fa:user .fw%%i18n:desktop.tags.mk-settings.profile%</p>
		<p class={ active: page == 'web' } onmousedown={ setPage.bind(null, 'web') }>%fa:desktop .fw%Web</p>
		<p class={ active: page == 'notification' } onmousedown={ setPage.bind(null, 'notification') }>%fa:R bell .fw%通知</p>
		<p class={ active: page == 'drive' } onmousedown={ setPage.bind(null, 'drive') }>%fa:cloud .fw%%i18n:desktop.tags.mk-settings.drive%</p>
		<p class={ active: page == 'apps' } onmousedown={ setPage.bind(null, 'apps') }>%fa:puzzle-piece .fw%アプリ</p>
		<p class={ active: page == 'twitter' } onmousedown={ setPage.bind(null, 'twitter') }>%fa:B twitter .fw%Twitter</p>
		<p class={ active: page == 'security' } onmousedown={ setPage.bind(null, 'security') }>%fa:unlock-alt .fw%%i18n:desktop.tags.mk-settings.security%</p>
		<p class={ active: page == 'api' } onmousedown={ setPage.bind(null, 'api') }>%fa:key .fw%API</p>
	</div>
	<div class="pages">
		<section class="profile" show={ page == 'profile' }>
			<h1>%i18n:desktop.tags.mk-settings.profile%</h1>
			<mk-profile-setting/>
		</section>

		<section class="web" show={ page == 'web' }>
			<h1>デザイン</h1>
			<a href="/i/customize-home" class="ui button">ホームをカスタマイズ</a>
		</section>

		<section class="drive" show={ page == 'drive' }>
			<h1>%i18n:desktop.tags.mk-settings.drive%</h1>
			<mk-drive-setting/>
		</section>

		<section class="apps" show={ page == 'apps' }>
			<h1>アプリケーション</h1>
			<mk-authorized-apps/>
		</section>

		<section class="twitter" show={ page == 'twitter' }>
			<h1>Twitter</h1>
			<mk-twitter-setting/>
		</section>

		<section class="password" show={ page == 'security' }>
			<h1>%i18n:desktop.tags.mk-settings.password%</h1>
			<mk-password-setting/>
		</section>

		<section class="2fa" show={ page == 'security' }>
			<h1>%i18n:desktop.tags.mk-settings.2fa%</h1>
			<mk-2fa-setting/>
		</section>

		<section class="signin" show={ page == 'security' }>
			<h1>サインイン履歴</h1>
			<mk-signin-history/>
		</section>

		<section class="api" show={ page == 'api' }>
			<h1>API</h1>
			<mk-api-info/>
		</section>
	</div>
	<style>
		:scope
			display flex
			width 100%
			height 100%

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

					> [data-fa]
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
					margin 32px

					h1
						display block
						margin 0 0 1em 0
						padding 0 0 8px 0
						font-size 1em
						color #555
						border-bottom solid 1px #eee

					label.checkbox
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

	</style>
	<script>
		this.page = 'profile';

		this.setPage = page => {
			this.page = page;
		};
	</script>
</mk-settings>

<mk-profile-setting>
	<label class="avatar ui from group">
		<p>%i18n:desktop.tags.mk-profile-setting.avatar%</p><img class="avatar" src={ I.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		<button class="ui" onclick={ avatar }>%i18n:desktop.tags.mk-profile-setting.choice-avatar%</button>
	</label>
	<label class="ui from group">
		<p>%i18n:desktop.tags.mk-profile-setting.name%</p>
		<input ref="accountName" type="text" value={ I.name } class="ui"/>
	</label>
	<label class="ui from group">
		<p>%i18n:desktop.tags.mk-profile-setting.location%</p>
		<input ref="accountLocation" type="text" value={ I.profile.location } class="ui"/>
	</label>
	<label class="ui from group">
		<p>%i18n:desktop.tags.mk-profile-setting.description%</p>
		<textarea ref="accountDescription" class="ui">{ I.description }</textarea>
	</label>
	<label class="ui from group">
		<p>%i18n:desktop.tags.mk-profile-setting.birthday%</p>
		<input ref="accountBirthday" type="date" value={ I.profile.birthday } class="ui"/>
	</label>
	<button class="ui primary" onclick={ updateAccount }>%i18n:desktop.tags.mk-profile-setting.save%</button>
	<style>
		:scope
			display block

			> .avatar
				> img
					display inline-block
					vertical-align top
					width 64px
					height 64px
					border-radius 4px

				> button
					margin-left 8px

	</style>
	<script>
		import updateAvatar from '../scripts/update-avatar';
		import notify from '../scripts/notify';

		this.mixin('i');
		this.mixin('api');

		this.avatar = () => {
			updateAvatar(this.I);
		};

		this.updateAccount = () => {
			this.api('i/update', {
				name: this.refs.accountName.value,
				location: this.refs.accountLocation.value || null,
				description: this.refs.accountDescription.value || null,
				birthday: this.refs.accountBirthday.value || null
			}).then(() => {
				notify('プロフィールを更新しました');
			});
		};
	</script>
</mk-profile-setting>

<mk-api-info>
	<p>Token: <code>{ I.token }</code></p>
	<p>%i18n:desktop.tags.mk-api-info.intro%</p>
	<div class="ui info warn"><p>%fa:exclamation-triangle%%i18n:desktop.tags.mk-api-info.caution%</p></div>
	<p>%i18n:desktop.tags.mk-api-info.regeneration-of-token%</p>
	<button class="ui" onclick={ regenerateToken }>%i18n:desktop.tags.mk-api-info.regenerate-token%</button>
	<style>
		:scope
			display block
			color #4a535a

			code
				display inline-block
				padding 4px 6px
				color #555
				background #eee
				border-radius 2px
	</style>
	<script>
		import passwordDialog from '../scripts/password-dialog';

		this.mixin('i');
		this.mixin('api');

		this.regenerateToken = () => {
			passwordDialog('%i18n:desktop.tags.mk-api-info.enter-password%', password => {
				this.api('i/regenerate_token', {
					password: password
				});
			});
		};
	</script>
</mk-api-info>

<mk-password-setting>
	<button onclick={ reset } class="ui primary">%i18n:desktop.tags.mk-password-setting.reset%</button>
	<style>
		:scope
			display block
			color #4a535a
	</style>
	<script>
		import passwordDialog from '../scripts/password-dialog';
		import dialog from '../scripts/dialog';
		import notify from '../scripts/notify';

		this.mixin('i');
		this.mixin('api');

		this.reset = () => {
			passwordDialog('%i18n:desktop.tags.mk-password-setting.enter-current-password%', currentPassword => {
				passwordDialog('%i18n:desktop.tags.mk-password-setting.enter-new-password%', newPassword => {
					passwordDialog('%i18n:desktop.tags.mk-password-setting.enter-new-password-again%', newPassword2 => {
						if (newPassword !== newPassword2) {
							dialog(null, '%i18n:desktop.tags.mk-password-setting.not-match%', [{
								text: 'OK'
							}]);
							return;
						}
						this.api('i/change_password', {
							current_password: currentPassword,
							new_password: newPassword
						}).then(() => {
							notify('%i18n:desktop.tags.mk-password-setting.changed%');
						});
					});
				});
			});
		};
	</script>
</mk-password-setting>

<mk-2fa-setting>
	<p>%i18n:desktop.tags.mk-2fa-setting.intro%<a href="%i18n:desktop.tags.mk-2fa-setting.url%" target="_blank">%i18n:desktop.tags.mk-2fa-setting.detail%</a></p>
	<div class="ui info warn"><p>%fa:exclamation-triangle%%i18n:desktop.tags.mk-2fa-setting.caution%</p></div>
	<p if={ !data && !I.two_factor_enabled }><button onclick={ register } class="ui primary">%i18n:desktop.tags.mk-2fa-setting.register%</button></p>
	<virtual if={ I.two_factor_enabled }>
		<p>%i18n:desktop.tags.mk-2fa-setting.already-registered%</p>
		<button onclick={ unregister } class="ui">%i18n:desktop.tags.mk-2fa-setting.unregister%</button>
	</virtual>
	<div if={ data }>
		<ol>
			<li>%i18n:desktop.tags.mk-2fa-setting.authenticator% <a href="https://support.google.com/accounts/answer/1066447" target="_blank">%i18n:desktop.tags.mk-2fa-setting.howtoinstall%</a></li>
			<li>%i18n:desktop.tags.mk-2fa-setting.scan%<br><img src={ data.qr }></li>
			<li>%i18n:desktop.tags.mk-2fa-setting.done%<br>
				<input type="number" ref="token" class="ui">
				<button onclick={ submit } class="ui primary">%i18n:desktop.tags.mk-2fa-setting.submit%</button>
			</li>
		</ol>
		<div class="ui info"><p>%fa:info-circle%%i18n:desktop.tags.mk-2fa-setting.info%</p></div>
	</div>
	<style>
		:scope
			display block
			color #4a535a

	</style>
	<script>
		import passwordDialog from '../scripts/password-dialog';
		import notify from '../scripts/notify';

		this.mixin('i');
		this.mixin('api');

		this.register = () => {
			passwordDialog('%i18n:desktop.tags.mk-2fa-setting.enter-password%', password => {
				this.api('i/2fa/register', {
					password: password
				}).then(data => {
					this.update({
						data: data
					});
				});
			});
		};

		this.unregister = () => {
			passwordDialog('%i18n:desktop.tags.mk-2fa-setting.enter-password%', password => {
				this.api('i/2fa/unregister', {
					password: password
				}).then(data => {
					notify('%i18n:desktop.tags.mk-2fa-setting.unregistered%');
					this.I.two_factor_enabled = false;
					this.I.update();
				});
			});
		};

		this.submit = () => {
			this.api('i/2fa/done', {
				token: this.refs.token.value
			}).then(() => {
				notify('%i18n:desktop.tags.mk-2fa-setting.success%');
				this.I.two_factor_enabled = true;
				this.I.update();
			}).catch(() => {
				notify('%i18n:desktop.tags.mk-2fa-setting.failed%');
			});
		};
	</script>
</mk-2fa-setting>

<mk-drive-setting>
	<svg viewBox="0 0 1 1" preserveAspectRatio="none">
		<circle
			riot-r={ r }
			cx="50%" cy="50%"
			fill="none"
			stroke-width="0.1"
			stroke="rgba(0, 0, 0, 0.05)"/>
		<circle
			riot-r={ r }
			cx="50%" cy="50%"
			riot-stroke-dasharray={ Math.PI * (r * 2) }
			riot-stroke-dashoffset={ strokeDashoffset }
			fill="none"
			stroke-width="0.1"
			riot-stroke={ color }/>
		<text x="50%" y="50%" dy="0.05" text-anchor="middle">{ (usageP * 100).toFixed(0) }%</text>
	</svg>

	<style>
		:scope
			display block
			color #4a535a

			> svg
				display block
				height 128px

				> circle
					transform-origin center
					transform rotate(-90deg)
					transition stroke-dashoffset 0.5s ease

				> text
					font-size 0.15px
					fill rgba(0, 0, 0, 0.6)

	</style>
	<script>
		this.mixin('api');

		this.r = 0.4;

		this.on('mount', () => {
			this.api('drive').then(info => {
				const usageP = info.usage / info.capacity;
				const color = `hsl(${180 - (usageP * 180)}, 80%, 70%)`;
				const strokeDashoffset = (1 - usageP) * (Math.PI * (this.r * 2));

				this.update({
					color,
					strokeDashoffset,
					usageP,
					usage: info.usage,
					capacity: info.capacity
				});
			});
		});
	</script>
</mk-drive-setting>
