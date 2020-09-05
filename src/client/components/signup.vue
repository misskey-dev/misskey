<template>
<form class="mk-signup" @submit.prevent="onSubmit" :autocomplete="Math.random()">
	<template v-if="meta">
		<mk-input v-if="meta.disableRegistration" v-model:value="invitationCode" type="text" :autocomplete="Math.random()" spellcheck="false" required>
			<span>{{ $t('invitationCode') }}</span>
			<template #prefix><fa :icon="faKey"/></template>
		</mk-input>
		<mk-input v-model:value="username" type="text" pattern="^[a-zA-Z0-9_]{1,20}$" :autocomplete="Math.random()" spellcheck="false" required @onUpdate:value="onChangeUsername">
			<span>{{ $t('username') }}</span>
			<template #prefix>@</template>
			<template #suffix>@{{ host }}</template>
			<template #desc>
				<span v-if="usernameState == 'wait'" style="color:#999"><fa :icon="faSpinner" pulse fixed-width/> {{ $t('checking') }}</span>
				<span v-if="usernameState == 'ok'" style="color:#3CB7B5"><fa :icon="faCheck" fixed-width/> {{ $t('available') }}</span>
				<span v-if="usernameState == 'unavailable'" style="color:#FF1161"><fa :icon="faExclamationTriangle" fixed-width/> {{ $t('unavailable') }}</span>
				<span v-if="usernameState == 'error'" style="color:#FF1161"><fa :icon="faExclamationTriangle" fixed-width/> {{ $t('error') }}</span>
				<span v-if="usernameState == 'invalid-format'" style="color:#FF1161"><fa :icon="faExclamationTriangle" fixed-width/> {{ $t('usernameInvalidFormat') }}</span>
				<span v-if="usernameState == 'min-range'" style="color:#FF1161"><fa :icon="faExclamationTriangle" fixed-width/> {{ $t('tooShort') }}</span>
				<span v-if="usernameState == 'max-range'" style="color:#FF1161"><fa :icon="faExclamationTriangle" fixed-width/> {{ $t('tooLong') }}</span>
			</template>
		</mk-input>
		<mk-input v-model:value="password" type="password" :autocomplete="Math.random()" required @onUpdate:value="onChangePassword">
			<span>{{ $t('password') }}</span>
			<template #prefix><fa :icon="faLock"/></template>
			<template #desc>
				<p v-if="passwordStrength == 'low'" style="color:#FF1161"><fa :icon="faExclamationTriangle" fixed-width/> {{ $t('weakPassword') }}</p>
				<p v-if="passwordStrength == 'medium'" style="color:#3CB7B5"><fa :icon="faCheck" fixed-width/> {{ $t('normalPassword') }}</p>
				<p v-if="passwordStrength == 'high'" style="color:#3CB7B5"><fa :icon="faCheck" fixed-width/> {{ $t('strongPassword') }}</p>
			</template>
		</mk-input>
		<mk-input v-model:value="retypedPassword" type="password" :autocomplete="Math.random()" required @onUpdate:value="onChangePasswordRetype">
			<span>{{ $t('password') }} ({{ $t('retype') }})</span>
			<template #prefix><fa :icon="faLock"/></template>
			<template #desc>
				<p v-if="passwordRetypeState == 'match'" style="color:#3CB7B5"><fa :icon="faCheck" fixed-width/> {{ $t('passwordMatched') }}</p>
				<p v-if="passwordRetypeState == 'not-match'" style="color:#FF1161"><fa :icon="faExclamationTriangle" fixed-width/> {{ $t('passwordNotMatched') }}</p>
			</template>
		</mk-input>
		<mk-switch v-model:value="ToSAgreement" v-if="meta.tosUrl">
			<i18n-t path="agreeTo">
				<a :href="meta.tosUrl" class="_link" target="_blank">{{ $t('tos') }}</a>
			</i18n-t>
		</mk-switch>
		<captcha v-if="meta.enableHcaptcha" class="captcha" provider="hcaptcha" ref="hcaptcha" v-model:value="hCaptchaResponse" :sitekey="meta.hcaptchaSiteKey"/>
		<captcha v-if="meta.enableRecaptcha" class="captcha" provider="grecaptcha" ref="recaptcha" v-model:value="reCaptchaResponse" :sitekey="meta.recaptchaSiteKey"/>
		<mk-button type="submit" :disabled="shouldDisableSubmitting" primary>{{ $t('start') }}</mk-button>
	</template>
</form>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { faLock, faExclamationTriangle, faSpinner, faCheck, faKey } from '@fortawesome/free-solid-svg-icons';
const getPasswordStrength = require('syuilo-password-strength');
import { toUnicode } from 'punycode';
import { host, url } from '../config';
import MkButton from './ui/button.vue';
import MkInput from './ui/input.vue';
import MkSwitch from './ui/switch.vue';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkSwitch,
		captcha: defineAsyncComponent(() => import('./captcha.vue')),
	},

	props: {
		autoSet: {
			type: Boolean,
			required: false,
			default: false,
		}
	},

	data() {
		return {
			host: toUnicode(host),
			username: '',
			password: '',
			retypedPassword: '',
			invitationCode: '',
			url,
			usernameState: null,
			passwordStrength: '',
			passwordRetypeState: null,
			submitting: false,
			ToSAgreement: false,
			hCaptchaResponse: null,
			reCaptchaResponse: null,
			faLock, faExclamationTriangle, faSpinner, faCheck, faKey
		}
	},

	computed: {
		meta() {
			return this.$store.state.instance.meta;
		},

		shouldDisableSubmitting(): boolean {
			return this.submitting ||
				this.meta.tosUrl && !this.ToSAgreement ||
				this.meta.enableHcaptcha && !this.hCaptchaResponse ||
				this.meta.enableRecaptcha && !this.reCaptchaResponse ||
				this.passwordRetypeState == 'not-match';
		},

		shouldShowProfileUrl(): boolean {
			return (this.username != '' &&
				this.usernameState != 'invalid-format' &&
				this.usernameState != 'min-range' &&
				this.usernameState != 'max-range');
		}
	},

	created() {
		if (this.autoSet) {
			this.$once('signup', res => {
				localStorage.setItem('i', res.i);
				location.reload();
			});
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

			this.$root.api('username/available', {
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
			if (this.submitting) return;
			this.submitting = true;

			this.$root.api('signup', {
				username: this.username,
				password: this.password,
				invitationCode: this.invitationCode,
				'hcaptcha-response': this.hCaptchaResponse,
				'g-recaptcha-response': this.reCaptchaResponse,
			}).then(() => {
				this.$root.api('signin', {
					username: this.username,
					password: this.password
				}).then(res => {
					this.$emit('signup', res);
				});
			}).catch(() => {
				this.submitting = false;
				this.$refs.hcaptcha?.reset?.();
				this.$refs.recaptcha?.reset?.();

				this.$root.dialog({
					type: 'error',
					text: this.$t('error')
				});
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.mk-signup {
	padding: 32px 0 0;

	.captcha {
		margin: 16px 0;
	}
}
</style>
