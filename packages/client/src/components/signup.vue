<template>
<form class="qlvuhzng _formRoot" :autocomplete="Math.random()" @submit.prevent="onSubmit">
	<template v-if="meta">
		<MkInput v-if="meta.disableRegistration" v-model="invitationCode" class="_formBlock" type="text" :autocomplete="Math.random()" spellcheck="false" required>
			<template #label>{{ $ts.invitationCode }}</template>
			<template #prefix><i class="fas fa-key"></i></template>
		</MkInput>
		<MkInput v-model="username" class="_formBlock" type="text" pattern="^[a-zA-Z0-9_]{1,20}$" :autocomplete="Math.random()" spellcheck="false" required data-cy-signup-username @update:modelValue="onChangeUsername">
			<template #label>{{ $ts.username }} <div v-tooltip:dialog="$ts.usernameInfo" class="_button _help"><i class="far fa-question-circle"></i></div></template>
			<template #prefix>@</template>
			<template #suffix>@{{ host }}</template>
			<template #caption>
				<span v-if="usernameState === 'wait'" style="color:#999"><i class="fas fa-spinner fa-pulse fa-fw"></i> {{ $ts.checking }}</span>
				<span v-else-if="usernameState === 'ok'" style="color: var(--success)"><i class="fas fa-check fa-fw"></i> {{ $ts.available }}</span>
				<span v-else-if="usernameState === 'unavailable'" style="color: var(--error)"><i class="fas fa-exclamation-triangle fa-fw"></i> {{ $ts.unavailable }}</span>
				<span v-else-if="usernameState === 'error'" style="color: var(--error)"><i class="fas fa-exclamation-triangle fa-fw"></i> {{ $ts.error }}</span>
				<span v-else-if="usernameState === 'invalid-format'" style="color: var(--error)"><i class="fas fa-exclamation-triangle fa-fw"></i> {{ $ts.usernameInvalidFormat }}</span>
				<span v-else-if="usernameState === 'min-range'" style="color: var(--error)"><i class="fas fa-exclamation-triangle fa-fw"></i> {{ $ts.tooShort }}</span>
				<span v-else-if="usernameState === 'max-range'" style="color: var(--error)"><i class="fas fa-exclamation-triangle fa-fw"></i> {{ $ts.tooLong }}</span>
			</template>
		</MkInput>
		<MkInput v-if="meta.emailRequiredForSignup" v-model="email" class="_formBlock" :debounce="true" type="email" :autocomplete="Math.random()" spellcheck="false" required data-cy-signup-email @update:modelValue="onChangeEmail">
			<template #label>{{ $ts.emailAddress }} <div v-tooltip:dialog="$ts._signup.emailAddressInfo" class="_button _help"><i class="far fa-question-circle"></i></div></template>
			<template #prefix><i class="fas fa-envelope"></i></template>
			<template #caption>
				<span v-if="emailState === 'wait'" style="color:#999"><i class="fas fa-spinner fa-pulse fa-fw"></i> {{ $ts.checking }}</span>
				<span v-else-if="emailState === 'ok'" style="color: var(--success)"><i class="fas fa-check fa-fw"></i> {{ $ts.available }}</span>
				<span v-else-if="emailState === 'unavailable:used'" style="color: var(--error)"><i class="fas fa-exclamation-triangle fa-fw"></i> {{ $ts._emailUnavailable.used }}</span>
				<span v-else-if="emailState === 'unavailable:format'" style="color: var(--error)"><i class="fas fa-exclamation-triangle fa-fw"></i> {{ $ts._emailUnavailable.format }}</span>
				<span v-else-if="emailState === 'unavailable:disposable'" style="color: var(--error)"><i class="fas fa-exclamation-triangle fa-fw"></i> {{ $ts._emailUnavailable.disposable }}</span>
				<span v-else-if="emailState === 'unavailable:mx'" style="color: var(--error)"><i class="fas fa-exclamation-triangle fa-fw"></i> {{ $ts._emailUnavailable.mx }}</span>
				<span v-else-if="emailState === 'unavailable:smtp'" style="color: var(--error)"><i class="fas fa-exclamation-triangle fa-fw"></i> {{ $ts._emailUnavailable.smtp }}</span>
				<span v-else-if="emailState === 'unavailable'" style="color: var(--error)"><i class="fas fa-exclamation-triangle fa-fw"></i> {{ $ts.unavailable }}</span>
				<span v-else-if="emailState === 'error'" style="color: var(--error)"><i class="fas fa-exclamation-triangle fa-fw"></i> {{ $ts.error }}</span>
			</template>
		</MkInput>
		<MkInput v-model="password" class="_formBlock" type="password" :autocomplete="Math.random()" required data-cy-signup-password @update:modelValue="onChangePassword">
			<template #label>{{ $ts.password }}</template>
			<template #prefix><i class="fas fa-lock"></i></template>
			<template #caption>
				<span v-if="passwordStrength == 'low'" style="color: var(--error)"><i class="fas fa-exclamation-triangle fa-fw"></i> {{ $ts.weakPassword }}</span>
				<span v-if="passwordStrength == 'medium'" style="color: var(--warn)"><i class="fas fa-check fa-fw"></i> {{ $ts.normalPassword }}</span>
				<span v-if="passwordStrength == 'high'" style="color: var(--success)"><i class="fas fa-check fa-fw"></i> {{ $ts.strongPassword }}</span>
			</template>
		</MkInput>
		<MkInput v-model="retypedPassword" class="_formBlock" type="password" :autocomplete="Math.random()" required data-cy-signup-password-retype @update:modelValue="onChangePasswordRetype">
			<template #label>{{ $ts.password }} ({{ $ts.retype }})</template>
			<template #prefix><i class="fas fa-lock"></i></template>
			<template #caption>
				<span v-if="passwordRetypeState == 'match'" style="color: var(--success)"><i class="fas fa-check fa-fw"></i> {{ $ts.passwordMatched }}</span>
				<span v-if="passwordRetypeState == 'not-match'" style="color: var(--error)"><i class="fas fa-exclamation-triangle fa-fw"></i> {{ $ts.passwordNotMatched }}</span>
			</template>
		</MkInput>
		<label v-if="meta.tosUrl" class="_formBlock tou">
			<input v-model="ToSAgreement" type="checkbox">
			<I18n :src="$ts.agreeTo">
				<template #0>
					<a :href="meta.tosUrl" class="_link" target="_blank">{{ $ts.tos }}</a>
				</template>
			</I18n>
		</label>
		<captcha v-if="meta.enableHcaptcha" ref="hcaptcha" v-model="hCaptchaResponse" class="_formBlock captcha" provider="hcaptcha" :sitekey="meta.hcaptchaSiteKey"/>
		<captcha v-if="meta.enableRecaptcha" ref="recaptcha" v-model="reCaptchaResponse" class="_formBlock captcha" provider="recaptcha" :sitekey="meta.recaptchaSiteKey"/>
		<MkButton class="_formBlock" type="submit" :disabled="shouldDisableSubmitting" gradate data-cy-signup-submit>{{ $ts.start }}</MkButton>
	</template>
</form>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
const getPasswordStrength = require('syuilo-password-strength');
import { toUnicode } from 'punycode/';
import { host, url } from '@/config';
import MkButton from './ui/button.vue';
import MkInput from './form/input.vue';
import MkSwitch from './form/switch.vue';
import * as os from '@/os';
import { login } from '@/account';

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

	emits: ['signup'],

	data() {
		return {
			host: toUnicode(host),
			username: '',
			password: '',
			retypedPassword: '',
			invitationCode: '',
			email: '',
			url,
			usernameState: null,
			emailState: null,
			passwordStrength: '',
			passwordRetypeState: null,
			submitting: false,
			ToSAgreement: false,
			hCaptchaResponse: null,
			reCaptchaResponse: null,
		}
	},

	computed: {
		meta() {
			return this.$instance;
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

			os.api('username/available', {
				username: this.username
			}).then(result => {
				this.usernameState = result.available ? 'ok' : 'unavailable';
			}).catch(err => {
				this.usernameState = 'error';
			});
		},

		onChangeEmail() {
			if (this.email == '') {
				this.emailState = null;
				return;
			}

			this.emailState = 'wait';

			os.api('email-address/available', {
				emailAddress: this.email
			}).then(result => {
				this.emailState = result.available ? 'ok' :
					result.reason === 'used' ? 'unavailable:used' :
					result.reason === 'format' ? 'unavailable:format' :
					result.reason === 'disposable' ? 'unavailable:disposable' :
					result.reason === 'mx' ? 'unavailable:mx' :
					result.reason === 'smtp' ? 'unavailable:smtp' :
					'unavailable';
			}).catch(err => {
				this.emailState = 'error';
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

			os.api('signup', {
				username: this.username,
				password: this.password,
				emailAddress: this.email,
				invitationCode: this.invitationCode,
				'hcaptcha-response': this.hCaptchaResponse,
				'g-recaptcha-response': this.reCaptchaResponse,
			}).then(() => {
				if (this.meta.emailRequiredForSignup) {
					os.alert({
						type: 'success',
						title: this.$ts._signup.almostThere,
						text: this.$t('_signup.emailSent', { email: this.email }),
					});
					this.$emit('signupEmailPending');
				} else {
					os.api('signin', {
						username: this.username,
						password: this.password
					}).then(res => {
						this.$emit('signup', res);

						if (this.autoSet) {
							login(res.i);
						}
					});
				}
			}).catch(() => {
				this.submitting = false;
				this.$refs.hcaptcha?.reset?.();
				this.$refs.recaptcha?.reset?.();

				os.alert({
					type: 'error',
					text: this.$ts.somethingHappened
				});
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.qlvuhzng {
	.captcha {
		margin: 16px 0;
	}

	> .tou {
		display: block;
		margin: 16px 0;
		cursor: pointer;
	}
}
</style>
