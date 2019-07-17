<template>
<form class="mk-signup" @submit.prevent="onSubmit" :autocomplete="Math.random()">
	<template v-if="meta">
		<ui-input v-if="meta.disableRegistration" v-model="invitationCode" type="text" :autocomplete="Math.random()" spellcheck="false" required styl="fill">
			<span>{{ $t('invitation-code') }}</span>
			<template #prefix><fa icon="id-card-alt"/></template>
			<template #desc v-html="this.$t('invitation-info').replace('{}', 'mailto:' + meta.maintainerEmail)"></template>
		</ui-input>
		<ui-input v-model="username" type="text" pattern="^[a-zA-Z0-9_]{1,20}$" :autocomplete="Math.random()" spellcheck="false" required @input="onChangeUsername" styl="fill">
			<span>{{ $t('username') }}</span>
			<template #prefix>@</template>
			<template #suffix>@{{ host }}</template>
			<template #desc>
				<span v-if="usernameState == 'wait'" style="color:#999"><fa icon="spinner" pulse fixed-width/> {{ $t('checking') }}</span>
				<span v-if="usernameState == 'ok'" style="color:#3CB7B5"><fa icon="check" fixed-width/> {{ $t('available') }}</span>
				<span v-if="usernameState == 'unavailable'" style="color:#FF1161"><fa icon="exclamation-triangle" fixed-width/> {{ $t('unavailable') }}</span>
				<span v-if="usernameState == 'error'" style="color:#FF1161"><fa icon="exclamation-triangle" fixed-width/> {{ $t('error') }}</span>
				<span v-if="usernameState == 'invalid-format'" style="color:#FF1161"><fa icon="exclamation-triangle" fixed-width/> {{ $t('invalid-format') }}</span>
				<span v-if="usernameState == 'min-range'" style="color:#FF1161"><fa icon="exclamation-triangle" fixed-width/> {{ $t('too-short') }}</span>
				<span v-if="usernameState == 'max-range'" style="color:#FF1161"><fa icon="exclamation-triangle" fixed-width/> {{ $t('too-long') }}</span>
			</template>
		</ui-input>
		<ui-input v-model="password" type="password" :autocomplete="Math.random()" required @input="onChangePassword" :with-password-meter="true" styl="fill">
			<span>{{ $t('password') }}</span>
			<template #prefix><fa icon="lock"/></template>
			<template #desc>
				<p v-if="passwordStrength == 'low'" style="color:#FF1161"><fa icon="exclamation-triangle" fixed-width/> {{ $t('weak-password') }}</p>
				<p v-if="passwordStrength == 'medium'" style="color:#3CB7B5"><fa icon="check" fixed-width/> {{ $t('normal-password') }}</p>
				<p v-if="passwordStrength == 'high'" style="color:#3CB7B5"><fa icon="check" fixed-width/> {{ $t('strong-password') }}</p>
			</template>
		</ui-input>
		<ui-input v-model="retypedPassword" type="password" :autocomplete="Math.random()" required @input="onChangePasswordRetype" styl="fill">
			<span>{{ $t('password') }} ({{ $t('retype') }})</span>
			<template #prefix><fa icon="lock"/></template>
			<template #desc>
				<p v-if="passwordRetypeState == 'match'" style="color:#3CB7B5"><fa icon="check" fixed-width/> {{ $t('password-matched') }}</p>
				<p v-if="passwordRetypeState == 'not-match'" style="color:#FF1161"><fa icon="exclamation-triangle" fixed-width/> {{ $t('password-not-matched') }}</p>
			</template>
		</ui-input>
		<ui-switch v-model="ToSAgreement" v-if="meta.ToSUrl">
			<i18n path="agree-to">
				<a :href="meta.ToSUrl" target="_blank">{{ $t('tos') }}</a>
			</i18n>
		</ui-switch>
		<div v-if="meta.enableRecaptcha" class="g-recaptcha" :data-sitekey="meta.recaptchaSiteKey" style="margin: 16px 0;"></div>
		<ui-button type="submit" :disabled=" submitting || !(meta.ToSUrl ? ToSAgreement : true) || passwordRetypeState == 'not-match'">{{ $t('create') }}</ui-button>
	</template>
</form>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
const getPasswordStrength = require('syuilo-password-strength');
import { host, url } from '../../../config';
import { toUnicode } from 'punycode';

export default Vue.extend({
	i18n: i18n('common/views/components/signup.vue'),

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
			meta: {},
			submitting: false,
			ToSAgreement: false
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

	created() {
		this.$root.getMeta().then(meta => {
			this.meta = meta;
		});
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
					localStorage.setItem('i', res.i);
					location.href = '/';
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

<style lang="stylus" scoped>
.mk-signup
	min-width 302px
</style>
