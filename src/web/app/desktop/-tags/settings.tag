
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
