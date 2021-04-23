<template>
<form class="mk-signup" @submit.prevent="onSubmit" :autocomplete="Math.random()">
	<template v-if="meta">
		<MkInput v-if="meta.disableRegistration" v-model:value="invitationCode" type="text" :autocomplete="Math.random()" spellcheck="false" required>
			<span>{{ $ts.invitationCode }}</span>
			<template #prefix><i class="fas fa-key"></i></template>
		</MkInput>
		<MkInput v-model:value="username" type="text" pattern="^[a-zA-Z0-9_]{1,20}$" :autocomplete="Math.random()" spellcheck="false" required @update:value="onChangeUsername">
			<span>{{ $ts.username }}</span>
			<template #prefix>@</template>
			<template #suffix>@{{ host }}</template>
			<template #desc>
				<span v-if="usernameState == 'wait'" style="color:#999"><i class="fas fa-spinner fa-pulse fa-fw"></i> {{ $ts.checking }}</span>
				<span v-if="usernameState == 'ok'" style="color:#3CB7B5"><i class="fas fa-check fa-fw"></i> {{ $ts.available }}</span>
				<span v-if="usernameState == 'unavailable'" style="color:#FF1161"><i class="fas fa-exclamation-triangle fa-fw"></i> {{ $ts.unavailable }}</span>
				<span v-if="usernameState == 'error'" style="color:#FF1161"><i class="fas fa-exclamation-triangle fa-fw"></i> {{ $ts.error }}</span>
				<span v-if="usernameState == 'invalid-format'" style="color:#FF1161"><i class="fas fa-exclamation-triangle fa-fw"></i> {{ $ts.usernameInvalidFormat }}</span>
				<span v-if="usernameState == 'min-range'" style="color:#FF1161"><i class="fas fa-exclamation-triangle fa-fw"></i> {{ $ts.tooShort }}</span>
				<span v-if="usernameState == 'max-range'" style="color:#FF1161"><i class="fas fa-exclamation-triangle fa-fw"></i> {{ $ts.tooLong }}</span>
			</template>
		</MkInput>
		<MkInput v-model:value="password" type="password" :autocomplete="Math.random()" required @update:value="onChangePassword">
			<span>{{ $ts.password }}</span>
			<template #prefix><i class="fas fa-lock"></i></template>
			<template #desc>
				<p v-if="passwordStrength == 'low'" style="color:#FF1161"><i class="fas fa-exclamation-triangle fa-fw"></i> {{ $ts.weakPassword }}</p>
				<p v-if="passwordStrength == 'medium'" style="color:#3CB7B5"><i class="fas fa-check fa-fw"></i> {{ $ts.normalPassword }}</p>
				<p v-if="passwordStrength == 'high'" style="color:#3CB7B5"><i class="fas fa-check fa-fw"></i> {{ $ts.strongPassword }}</p>
			</template>
		</MkInput>
		<MkInput v-model:value="retypedPassword" type="password" :autocomplete="Math.random()" required @update:value="onChangePasswordRetype">
			<span>{{ $ts.password }} ({{ $ts.retype }})</span>
			<template #prefix><i class="fas fa-lock"></i></template>
			<template #desc>
				<p v-if="passwordRetypeState == 'match'" style="color:#3CB7B5"><i class="fas fa-check fa-fw"></i> {{ $ts.passwordMatched }}</p>
				<p v-if="passwordRetypeState == 'not-match'" style="color:#FF1161"><i class="fas fa-exclamation-triangle fa-fw"></i> {{ $ts.passwordNotMatched }}</p>
			</template>
		</MkInput>
		<label v-if="meta.tosUrl" class="tou">
			<input type="checkbox" v-model="ToSAgreement">
			<I18n :src="$ts.agreeTo">
				<template #0>
					<a :href="meta.tosUrl" class="_link" target="_blank">{{ $ts.tos }}</a>
				</template>
			</I18n>
		</label>
		<captcha v-if="meta.enableHcaptcha" class="captcha" provider="hcaptcha" ref="hcaptcha" v-model:value="hCaptchaResponse" :sitekey="meta.hcaptchaSiteKey"/>
		<captcha v-if="meta.enableRecaptcha" class="captcha" provider="recaptcha" ref="recaptcha" v-model:value="reCaptchaResponse" :sitekey="meta.recaptchaSiteKey"/>
		<MkButton type="submit" :disabled="shouldDisableSubmitting" primary>{{ $ts.start }}</MkButton>
	</template>
</form>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
const getPasswordStrength = require('syuilo-password-strength');
import { toUnicode } from 'punycode/';
import { host, url } from '@client/config';
import MkButton from './ui/button.vue';
import MkInput from './ui/input.vue';
import MkSwitch from './ui/switch.vue';
import * as os from '@client/os';
import { login } from '@client/account';

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
			url,
			usernameState: null,
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
				invitationCode: this.invitationCode,
				'hcaptcha-response': this.hCaptchaResponse,
				'g-recaptcha-response': this.reCaptchaResponse,
			}).then(() => {
				os.api('signin', {
					username: this.username,
					password: this.password
				}).then(res => {
					this.$emit('signup', res);

					if (this.autoSet) {
						login(res.i);
					}
				});
			}).catch(() => {
				this.submitting = false;
				this.$refs.hcaptcha?.reset?.();
				this.$refs.recaptcha?.reset?.();

				os.dialog({
					type: 'error',
					text: this.$ts.somethingHappened
				});
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.mk-signup {
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
