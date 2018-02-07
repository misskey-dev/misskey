<mk-signup>
	<form onsubmit={ onsubmit } autocomplete="off">
		<label class="username">
			<p class="caption">%fa:at%%i18n:common.tags.mk-signup.username%</p>
			<input ref="username" type="text" pattern="^[a-zA-Z0-9-]{3,20}$" placeholder="a~z、A~Z、0~9、-" autocomplete="off" required="required" onkeyup={ onChangeUsername }/>
			<p class="profile-page-url-preview" v-if="refs.username.value != '' && username-state != 'invalidFormat' && username-state != 'minRange' && username-state != 'maxRange'">{ _URL_ + '/' + refs.username.value }</p>
			<p class="info" v-if="usernameState == 'wait'" style="color:#999">%fa:spinner .pulse .fw%%i18n:common.tags.mk-signup.checking%</p>
			<p class="info" v-if="usernameState == 'ok'" style="color:#3CB7B5">%fa:check .fw%%i18n:common.tags.mk-signup.available%</p>
			<p class="info" v-if="usernameState == 'unavailable'" style="color:#FF1161">%fa:exclamation-triangle .fw%%i18n:common.tags.mk-signup.unavailable%</p>
			<p class="info" v-if="usernameState == 'error'" style="color:#FF1161">%fa:exclamation-triangle .fw%%i18n:common.tags.mk-signup.error%</p>
			<p class="info" v-if="usernameState == 'invalid-format'" style="color:#FF1161">%fa:exclamation-triangle .fw%%i18n:common.tags.mk-signup.invalid-format%</p>
			<p class="info" v-if="usernameState == 'min-range'" style="color:#FF1161">%fa:exclamation-triangle .fw%%i18n:common.tags.mk-signup.too-short%</p>
			<p class="info" v-if="usernameState == 'max-range'" style="color:#FF1161">%fa:exclamation-triangle .fw%%i18n:common.tags.mk-signup.too-long%</p>
		</label>
		<label class="password">
			<p class="caption">%fa:lock%%i18n:common.tags.mk-signup.password%</p>
			<input ref="password" type="password" placeholder="%i18n:common.tags.mk-signup.password-placeholder%" autocomplete="off" required="required" onkeyup={ onChangePassword }/>
			<div class="meter" v-if="passwordStrength != ''" data-strength={ passwordStrength }>
				<div class="value" ref="passwordMetar"></div>
			</div>
			<p class="info" v-if="passwordStrength == 'low'" style="color:#FF1161">%fa:exclamation-triangle .fw%%i18n:common.tags.mk-signup.weak-password%</p>
			<p class="info" v-if="passwordStrength == 'medium'" style="color:#3CB7B5">%fa:check .fw%%i18n:common.tags.mk-signup.normal-password%</p>
			<p class="info" v-if="passwordStrength == 'high'" style="color:#3CB7B5">%fa:check .fw%%i18n:common.tags.mk-signup.strong-password%</p>
		</label>
		<label class="retype-password">
			<p class="caption">%fa:lock%%i18n:common.tags.mk-signup.password%(%i18n:common.tags.mk-signup.retype%)</p>
			<input ref="passwordRetype" type="password" placeholder="%i18n:common.tags.mk-signup.retype-placeholder%" autocomplete="off" required="required" onkeyup={ onChangePasswordRetype }/>
			<p class="info" v-if="passwordRetypeState == 'match'" style="color:#3CB7B5">%fa:check .fw%%i18n:common.tags.mk-signup.password-matched%</p>
			<p class="info" v-if="passwordRetypeState == 'not-match'" style="color:#FF1161">%fa:exclamation-triangle .fw%%i18n:common.tags.mk-signup.password-not-matched%</p>
		</label>
		<label class="recaptcha">
			<p class="caption"><virtual v-if="recaptchaed">%fa:toggle-on%</virtual><virtual v-if="!recaptchaed">%fa:toggle-off%</virtual>%i18n:common.tags.mk-signup.recaptcha%</p>
			<div v-if="recaptcha" class="g-recaptcha" data-callback="onRecaptchaed" data-expired-callback="onRecaptchaExpired" data-sitekey={ recaptcha.site_key }></div>
		</label>
		<label class="agree-tou">
			<input name="agree-tou" type="checkbox" autocomplete="off" required="required"/>
			<p><a href={ touUrl } target="_blank">利用規約</a>に同意する</p>
		</label>
		<button @click="onsubmit">%i18n:common.tags.mk-signup.create%</button>
	</form>
	<style lang="stylus" scoped>
		:scope
			display block
			min-width 302px
			overflow hidden

			> form

				label
					display block
					margin 16px 0

					> .caption
						margin 0 0 4px 0
						color #828888
						font-size 0.95em

						> [data-fa]
							margin-right 0.25em
							color #96adac

					> .info
						display block
						margin 4px 0
						font-size 0.8em

						> [data-fa]
							margin-right 0.3em

					&.username
						.profile-page-url-preview
							display block
							margin 4px 8px 0 4px
							font-size 0.8em
							color #888

							&:empty
								display none

							&:not(:empty) + .info
								margin-top 0

					&.password
						.meter
							display block
							margin-top 8px
							width 100%
							height 8px

							&[data-strength='']
								display none

							&[data-strength='low']
								> .value
									background #d73612

							&[data-strength='medium']
								> .value
									background #d7ca12

							&[data-strength='high']
								> .value
									background #61bb22

							> .value
								display block
								width 0%
								height 100%
								background transparent
								border-radius 4px
								transition all 0.1s ease

				[type=text], [type=password]
					user-select text
					display inline-block
					cursor auto
					padding 0 12px
					margin 0
					width 100%
					line-height 44px
					font-size 1em
					color #333 !important
					background #fff !important
					outline none
					border solid 1px rgba(0, 0, 0, 0.1)
					border-radius 4px
					box-shadow 0 0 0 114514px #fff inset
					transition all .3s ease

					&:hover
						border-color rgba(0, 0, 0, 0.2)
						transition all .1s ease

					&:focus
						color $theme-color !important
						border-color $theme-color
						box-shadow 0 0 0 1024px #fff inset, 0 0 0 4px rgba($theme-color, 10%)
						transition all 0s ease

					&:disabled
						opacity 0.5

				.agree-tou
					padding 4px
					border-radius 4px

					&:hover
						background #f4f4f4

					&:active
						background #eee

					&, *
						cursor pointer

					p
						display inline
						color #555

				button
					margin 0 0 32px 0
					padding 16px
					width 100%
					font-size 1em
					color #fff
					background $theme-color
					border-radius 3px

					&:hover
						background lighten($theme-color, 5%)

					&:active
						background darken($theme-color, 5%)

	</style>
	<script lang="typescript">
		this.mixin('api');
		const getPasswordStrength = require('syuilo-password-strength');

		this.usernameState = null;
		this.passwordStrength = '';
		this.passwordRetypeState = null;
		this.recaptchaed = false;

		this.aboutUrl = `${_DOCS_URL_}/${_LANG_}/tou`;

		window.onRecaptchaed = () => {
			this.recaptchaed = true;
			this.update();
		};

		window.onRecaptchaExpired = () => {
			this.recaptchaed = false;
			this.update();
		};

		this.on('mount', () => {
			this.update({
				recaptcha: {
					site_key: _RECAPTCHA_SITEKEY_
				}
			});

			const head = document.getElementsByTagName('head')[0];
			const script = document.createElement('script');
			script.setAttribute('src', 'https://www.google.com/recaptcha/api.js');
			head.appendChild(script);
		});

		this.onChangeUsername = () => {
			const username = this.$refs.username.value;

			if (username == '') {
				this.update({
					usernameState: null
				});
				return;
			}

			const err =
				!username.match(/^[a-zA-Z0-9\-]+$/) ? 'invalid-format' :
				username.length < 3 ? 'min-range' :
				username.length > 20 ? 'max-range' :
				null;

			if (err) {
				this.update({
					usernameState: err
				});
				return;
			}

			this.update({
				usernameState: 'wait'
			});

			this.api('username/available', {
				username: username
			}).then(result => {
				this.update({
					usernameState: result.available ? 'ok' : 'unavailable'
				});
			}).catch(err => {
				this.update({
					usernameState: 'error'
				});
			});
		};

		this.onChangePassword = () => {
			const password = this.$refs.password.value;

			if (password == '') {
				this.passwordStrength = '';
				return;
			}

			const strength = getPasswordStrength(password);
			this.passwordStrength = strength > 0.7 ? 'high' : strength > 0.3 ? 'medium' : 'low';
			this.update();
			this.$refs.passwordMetar.style.width = `${strength * 100}%`;
		};

		this.onChangePasswordRetype = () => {
			const password = this.$refs.password.value;
			const retypedPassword = this.$refs.passwordRetype.value;

			if (retypedPassword == '') {
				this.passwordRetypeState = null;
				return;
			}

			this.passwordRetypeState = password == retypedPassword ? 'match' : 'not-match';
		};

		this.onsubmit = e => {
			e.preventDefault();

			const username = this.$refs.username.value;
			const password = this.$refs.password.value;

			const locker = document.body.appendChild(document.createElement('mk-locker'));

			this.api('signup', {
				username: username,
				password: password,
				'g-recaptcha-response': grecaptcha.getResponse()
			}).then(() => {
				this.api('signin', {
					username: username,
					password: password
				}).then(() => {
					location.href = '/';
				});
			}).catch(() => {
				alert('%i18n:common.tags.mk-signup.some-error%');

				grecaptcha.reset();
				this.recaptchaed = false;

				locker.parentNode.removeChild(locker);
			});

			return false;
		};
	</script>
</mk-signup>
