
<mk-profile-setting>
	<label class="avatar ui from group">
		<p>%i18n:desktop.tags.mk-profile-setting.avatar%</p><img class="avatar" src={ I.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		<button class="ui" @click="avatar">%i18n:desktop.tags.mk-profile-setting.choice-avatar%</button>
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
	<button class="ui primary" @click="updateAccount">%i18n:desktop.tags.mk-profile-setting.save%</button>
	<style lang="stylus" scoped>
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
	<script lang="typescript">
		import updateAvatar from '../scripts/update-avatar';
		import notify from '../scripts/notify';

		this.mixin('i');
		this.mixin('api');

		this.avatar = () => {
			updateAvatar(this.I);
		};

		this.updateAccount = () => {
			this.api('i/update', {
				name: this.$refs.accountName.value,
				location: this.$refs.accountLocation.value || null,
				description: this.$refs.accountDescription.value || null,
				birthday: this.$refs.accountBirthday.value || null
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
	<button class="ui" @click="regenerateToken">%i18n:desktop.tags.mk-api-info.regenerate-token%</button>
	<style lang="stylus" scoped>
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
	<script lang="typescript">
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
	<button @click="reset" class="ui primary">%i18n:desktop.tags.mk-password-setting.reset%</button>
	<style lang="stylus" scoped>
		:scope
			display block
			color #4a535a
	</style>
	<script lang="typescript">
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
	<p v-if="!data && !I.two_factor_enabled"><button @click="register" class="ui primary">%i18n:desktop.tags.mk-2fa-setting.register%</button></p>
	<template v-if="I.two_factor_enabled">
		<p>%i18n:desktop.tags.mk-2fa-setting.already-registered%</p>
		<button @click="unregister" class="ui">%i18n:desktop.tags.mk-2fa-setting.unregister%</button>
	</template>
	<div v-if="data">
		<ol>
			<li>%i18n:desktop.tags.mk-2fa-setting.authenticator% <a href="https://support.google.com/accounts/answer/1066447" target="_blank">%i18n:desktop.tags.mk-2fa-setting.howtoinstall%</a></li>
			<li>%i18n:desktop.tags.mk-2fa-setting.scan%<br><img src={ data.qr }></li>
			<li>%i18n:desktop.tags.mk-2fa-setting.done%<br>
				<input type="number" ref="token" class="ui">
				<button @click="submit" class="ui primary">%i18n:desktop.tags.mk-2fa-setting.submit%</button>
			</li>
		</ol>
		<div class="ui info"><p>%fa:info-circle%%i18n:desktop.tags.mk-2fa-setting.info%</p></div>
	</div>
	<style lang="stylus" scoped>
		:scope
			display block
			color #4a535a

	</style>
	<script lang="typescript">
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
				token: this.$refs.token.value
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

	<style lang="stylus" scoped>
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
	<script lang="typescript">
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

<mk-mute-setting>
	<div class="none ui info" v-if="!fetching && users.length == 0">
		<p>%fa:info-circle%%i18n:desktop.tags.mk-mute-setting.no-users%</p>
	</div>
	<div class="users" v-if="users.length != 0">
		<div each={ user in users }>
			<p><b>{ user.name }</b> @{ user.username }</p>
		</div>
	</div>

	<style lang="stylus" scoped>
		:scope
			display block

	</style>
	<script lang="typescript">
		this.mixin('api');

		this.apps = [];
		this.fetching = true;

		this.on('mount', () => {
			this.api('mute/list').then(x => {
				this.update({
					fetching: false,
					users: x.users
				});
			});
		});
	</script>
</mk-mute-setting>
