<template>
<form class="mk-signup" @submit.prevent="onSubmit" :autocomplete="Math.random()">
	<ui-input v-model="username" type="text" pattern="^[a-zA-Z0-9_]{1,20}$" :autocomplete="Math.random()" spellcheck="false" required @input="onChangeUsername">
		<span>%i18n:@username%</span>
		<span slot="prefix">@</span>
		<span slot="suffix">@{{ host }}</span>
		<p slot="text" v-if="usernameState == 'wait'" style="color:#999">%fa:spinner .pulse .fw% %i18n:@checking%</p>
		<p slot="text" v-if="usernameState == 'ok'" style="color:#3CB7B5">%fa:check .fw% %i18n:@available%</p>
		<p slot="text" v-if="usernameState == 'unavailable'" style="color:#FF1161">%fa:exclamation-triangle .fw% %i18n:@unavailable%</p>
		<p slot="text" v-if="usernameState == 'error'" style="color:#FF1161">%fa:exclamation-triangle .fw% %i18n:@error%</p>
		<p slot="text" v-if="usernameState == 'invalid-format'" style="color:#FF1161">%fa:exclamation-triangle .fw% %i18n:@invalid-format%</p>
		<p slot="text" v-if="usernameState == 'min-range'" style="color:#FF1161">%fa:exclamation-triangle .fw% %i18n:@too-short%</p>
		<p slot="text" v-if="usernameState == 'max-range'" style="color:#FF1161">%fa:exclamation-triangle .fw% %i18n:@too-long%</p>
	</ui-input>
	<ui-input v-model="password" type="password" :autocomplete="Math.random()" required @input="onChangePassword" :with-password-meter="true">
		<span>%i18n:@password%</span>
		<span slot="prefix">%fa:lock%</span>
		<div slot="text">
			<p slot="text" v-if="passwordStrength == 'low'" style="color:#FF1161">%fa:exclamation-triangle .fw% %i18n:@weak-password%</p>
			<p slot="text" v-if="passwordStrength == 'medium'" style="color:#3CB7B5">%fa:check .fw% %i18n:@normal-password%</p>
			<p slot="text" v-if="passwordStrength == 'high'" style="color:#3CB7B5">%fa:check .fw% %i18n:@strong-password%</p>
		</div>
	</ui-input>
	<ui-input v-model="retypedPassword" type="password" :autocomplete="Math.random()" required @input="onChangePasswordRetype">
		<span>%i18n:@password% (%i18n:@retype%)</span>
		<span slot="prefix">%fa:lock%</span>
		<div slot="text">
			<p slot="text" v-if="passwordRetypeState == 'match'" style="color:#3CB7B5">%fa:check .fw% %i18n:@password-matched%</p>
			<p slot="text" v-if="passwordRetypeState == 'not-match'" style="color:#FF1161">%fa:exclamation-triangle .fw% %i18n:@password-not-matched%</p>
		</div>
	</ui-input>
	<div v-if="recaptchaSitekey != null" class="g-recaptcha" :data-sitekey="recaptchaSitekey" style="margin: 16px 0;"></div>
	<label class="agree-tou" style="display: block; margin: 16px 0;">
		<input name="agree-tou" type="checkbox" required/>
		<p><a :href="touUrl" target="_blank">利用規約</a>に同意する</p>
	</label>
	<ui-button type="submit">%i18n:@create%</ui-button>
</form>
</template>

<script lang="ts">
import Vue from 'vue';
const getPasswordStrength = require('syuilo-password-strength');
import { host, url, docsUrl, lang, recaptchaSitekey } from '../../../config';

export default Vue.extend({
	data() {
		return {
			host,
			username: '',
			password: '',
			retypedPassword: '',
			url,
			touUrl: `${docsUrl}/${lang}/tou`,
			recaptchaSitekey,
			usernameState: null,
			passwordStrength: '',
			passwordRetypeState: null
		}
	},
	computed: {
		shouldShowProfileUrl(): boolean {
			return (this.username != '' &&
				this.usernameState != 'invalid-format' &&
				this.usernameState != 'min-range' &&
				this.usernameState != 'max-range');
		}
	},
	methods: {
		onChangeUsername() {
			if (this.username == '') {
				this.usernameState = null;
				return;
			}

			const err =
				!this.username.match(/^[a-zA-Z0-9_]+$/) ? 'invalid-format' :
				this.username.length < 1 ? 'min-range' :
				this.username.length > 20 ? 'max-range' :
				null;

			if (err) {
				this.usernameState = err;
				return;
			}

			this.usernameState = 'wait';

			(this as any).api('username/available', {
				username: this.username
			}).then(result => {
				this.usernameState = result.available ? 'ok' : 'unavailable';
			}).catch(err => {
				this.usernameState = 'error';
			});
		},
		onChangePassword() {
			if (this.password == '') {
				this.passwordStrength = '';
				return;
			}

			const strength = getPasswordStrength(this.password);
			this.passwordStrength = strength > 0.7 ? 'high' : strength > 0.3 ? 'medium' : 'low';
		},
		onChangePasswordRetype() {
			if (this.retypedPassword == '') {
				this.passwordRetypeState = null;
				return;
			}

			this.passwordRetypeState = this.password == this.retypedPassword ? 'match' : 'not-match';
		},
		onSubmit() {
			(this as any).api('signup', {
				username: this.username,
				password: this.password,
				'g-recaptcha-response': recaptchaSitekey != null ? (window as any).grecaptcha.getResponse() : null
			}).then(() => {
				(this as any).api('signin', {
					username: this.username,
					password: this.password
				}).then(() => {
					location.href = '/';
				});
			}).catch(() => {
				alert('%i18n:@some-error%');

				if (recaptchaSitekey != null) {
					(window as any).grecaptcha.reset();
				}
			});
		}
	},
	mounted() {
		if (recaptchaSitekey != null) {
			const head = document.getElementsByTagName('head')[0];
			const script = document.createElement('script');
			script.setAttribute('src', 'https://www.google.com/recaptcha/api.js');
			head.appendChild(script);
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-signup
	min-width 302px

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

</style>
