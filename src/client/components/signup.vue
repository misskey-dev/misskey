<template>
<form class="mk-signup" @submit.prevent="onSubmit" :autocomplete="Math.random()">
	<template v-if="meta">
		<mk-input v-if="meta.disableRegistration" v-model="invitationCode" type="text" :autocomplete="Math.random()" spellcheck="false" required>
			<span>{{ $t('invitation-code') }}</span>
			<template #prefix><fa icon="id-card-alt"/></template>
			<template #desc v-html="this.$t('invitation-info').replace('{}', 'mailto:' + meta.maintainerEmail)"></template>
		</mk-input>
		<mk-input v-model="username" type="text" pattern="^[a-zA-Z0-9_]{1,20}$" :autocomplete="Math.random()" spellcheck="false" required @input="onChangeUsername">
			<span>{{ $t('username') }}</span>
			<template #prefix>@</template>
			<template #suffix>@{{ host }}</template>
			<template #desc>
				<span v-if="usernameState == 'wait'" style="color:#999"><fa :icon="faSpinner" pulse fixed-width/> {{ $t('checking') }}</span>
				<span v-if="usernameState == 'ok'" style="color:#3CB7B5"><fa :icon="faCheck" fixed-width/> {{ $t('available') }}</span>
				<span v-if="usernameState == 'unavailable'" style="color:#FF1161"><fa :icon="faExclamationTriangle" fixed-width/> {{ $t('unavailable') }}</span>
				<span v-if="usernameState == 'error'" style="color:#FF1161"><fa :icon="faExclamationTriangle" fixed-width/> {{ $t('error') }}</span>
				<span v-if="usernameState == 'invalid-format'" style="color:#FF1161"><fa :icon="faExclamationTriangle" fixed-width/> {{ $t('invalid-format') }}</span>
				<span v-if="usernameState == 'min-range'" style="color:#FF1161"><fa :icon="faExclamationTriangle" fixed-width/> {{ $t('too-short') }}</span>
				<span v-if="usernameState == 'max-range'" style="color:#FF1161"><fa :icon="faExclamationTriangle" fixed-width/> {{ $t('too-long') }}</span>
			</template>
		</mk-input>
		<mk-input v-model="password" type="password" :autocomplete="Math.random()" required @input="onChangePassword">
			<span>{{ $t('password') }}</span>
			<template #prefix><fa :icon="faLock"/></template>
			<template #desc>
				<p v-if="passwordStrength == 'low'" style="color:#FF1161"><fa :icon="faExclamationTriangle" fixed-width/> {{ $t('weak-password') }}</p>
				<p v-if="passwordStrength == 'medium'" style="color:#3CB7B5"><fa :icon="faCheck" fixed-width/> {{ $t('normal-password') }}</p>
				<p v-if="passwordStrength == 'high'" style="color:#3CB7B5"><fa :icon="faCheck" fixed-width/> {{ $t('strong-password') }}</p>
			</template>
		</mk-input>
		<mk-input v-model="retypedPassword" type="password" :autocomplete="Math.random()" required @input="onChangePasswordRetype">
			<span>{{ $t('password') }} ({{ $t('retype') }})</span>
			<template #prefix><fa :icon="faLock"/></template>
			<template #desc>
				<p v-if="passwordRetypeState == 'match'" style="color:#3CB7B5"><fa :icon="faCheck" fixed-width/> {{ $t('password-matched') }}</p>
				<p v-if="passwordRetypeState == 'not-match'" style="color:#FF1161"><fa :icon="faExclamationTriangle" fixed-width/> {{ $t('password-not-matched') }}</p>
			</template>
		</mk-input>
		<mk-switch v-model="ToSAgreement" v-if="meta.tosUrl">
			<i18n path="agreeTo">
				<a :href="meta.tosUrl" target="_blank">{{ $t('tos') }}</a>
			</i18n>
		</mk-switch>
		<div v-if="meta.enableRecaptcha" class="g-recaptcha" :data-sitekey="meta.recaptchaSiteKey" style="margin: 16px 0;"></div>
		<mk-button type="submit" :disabled=" submitting || !(meta.tosUrl ? ToSAgreement : true) || passwordRetypeState == 'not-match'" primary>{{ $t('start') }}</mk-button>
	</template>
</form>
</template>

<script lang="ts">
import Vue from 'vue';
import { faLock, faExclamationTriangle, faSpinner, faCheck } from '@fortawesome/free-solid-svg-icons';
const getPasswordStrength = require('syuilo-password-strength');
import { toUnicode } from 'punycode';
import i18n from '../i18n';
import { host, url } from '../config';
import MkButton from './ui/button.vue';
import MkInput from './ui/input.vue';
import MkSwitch from './ui/switch.vue';

export default Vue.extend({
	i18n,

	components: {
		MkButton,
		MkInput,
		MkSwitch,
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
			faLock, faExclamationTriangle, faSpinner, faCheck
		}
	},

	props: {
		autoSet: {
			type: Boolean,
			required: false,
			default: false,
		}
	},

	computed: {
		meta() {
			return this.$store.state.instance.meta;
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

	mounted() {
		const head = document.getElementsByTagName('head')[0];
		const script = document.createElement('script');
		script.setAttribute('src', 'https://www.google.com/recaptcha/api.js');
		head.appendChild(script);
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
				'g-recaptcha-response': this.meta.enableRecaptcha ? (window as any).grecaptcha.getResponse() : null
			}).then(() => {
				this.$root.api('signin', {
					username: this.username,
					password: this.password
				}).then(res => {
					this.$emit('signup', res);
				});
			}).catch(() => {
				this.submitting = false;

				this.$root.dialog({
					type: 'error',
					text: this.$t('some-error')
				});

				if (this.meta.enableRecaptcha) {
					(window as any).grecaptcha.reset();
				}
			});
		}
	}
});
</script>
