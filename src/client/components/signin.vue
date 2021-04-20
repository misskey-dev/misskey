<template>
<form class="eppvobhk _monolithic_" :class="{ signing, totpLogin }" @submit.prevent="onSubmit">
	<div class="auth _section">
		<div class="avatar" :style="{ backgroundImage: user ? `url('${ user.avatarUrl }')` : null }" v-show="withAvatar"></div>
		<div class="normal-signin" v-if="!totpLogin">
			<MkInput v-model:value="username" type="text" pattern="^[a-zA-Z0-9_]+$" spellcheck="false" autofocus required @update:value="onUsernameChange">
				<span>{{ $ts.username }}</span>
				<template #prefix>@</template>
				<template #suffix>@{{ host }}</template>
			</MkInput>
			<MkInput v-model:value="password" type="password" :with-password-toggle="true" v-if="!user || user && !user.usePasswordLessLogin" required>
				<span>{{ $ts.password }}</span>
				<template #prefix><i class="fas fa-lock"></i></template>
			</MkInput>
			<MkButton type="submit" primary :disabled="signing" style="margin: 0 auto;">{{ signing ? $ts.loggingIn : $ts.login }}</MkButton>
		</div>
		<div class="2fa-signin" v-if="totpLogin" :class="{ securityKeys: user && user.securityKeys }">
			<div v-if="user && user.securityKeys" class="twofa-group tap-group">
				<p>{{ $ts.tapSecurityKey }}</p>
				<MkButton @click="queryKey" v-if="!queryingKey">
					{{ $ts.retry }}
				</MkButton>
			</div>
			<div class="or-hr" v-if="user && user.securityKeys">
				<p class="or-msg">{{ $ts.or }}</p>
			</div>
			<div class="twofa-group totp-group">
				<p style="margin-bottom:0;">{{ $ts.twoStepAuthentication }}</p>
				<MkInput v-model:value="password" type="password" :with-password-toggle="true" v-if="user && user.usePasswordLessLogin" required>
					<span>{{ $ts.password }}</span>
					<template #prefix><i class="fas fa-lock"></i></template>
				</MkInput>
				<MkInput v-model:value="token" type="text" pattern="^[0-9]{6}$" autocomplete="off" spellcheck="false" required>
					<span>{{ $ts.token }}</span>
					<template #prefix><i class="fas fa-gavel"></i></template>
				</MkInput>
				<MkButton type="submit" :disabled="signing" primary style="margin: 0 auto;">{{ signing ? $ts.loggingIn : $ts.login }}</MkButton>
			</div>
		</div>
	</div>
	<div class="social _section">
		<a class="_borderButton _gap" v-if="meta && meta.enableTwitterIntegration" :href="`${apiUrl}/signin/twitter`"><i class="fab fa-twitter" style="margin-right: 4px;"></i>{{ $t('signinWith', { x: 'Twitter' }) }}</a>
		<a class="_borderButton _gap" v-if="meta && meta.enableGithubIntegration" :href="`${apiUrl}/signin/github`"><i class="fab fa-github" style="margin-right: 4px;"></i>{{ $t('signinWith', { x: 'GitHub' }) }}</a>
		<a class="_borderButton _gap" v-if="meta && meta.enableDiscordIntegration" :href="`${apiUrl}/signin/discord`"><i class="fab fa-discord" style="margin-right: 4px;"></i>{{ $t('signinWith', { x: 'Discord' }) }}</a>
	</div>
</form>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { toUnicode } from 'punycode/';
import MkButton from './ui/button.vue';
import MkInput from './ui/input.vue';
import { apiUrl, host } from '@client/config';
import { byteify, hexify } from '@client/scripts/2fa';
import * as os from '@client/os';
import { login } from '@client/account';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
	},

	props: {
		withAvatar: {
			type: Boolean,
			required: false,
			default: true
		},
		autoSet: {
			type: Boolean,
			required: false,
			default: false,
		}
	},

	emits: ['login'],

	data() {
		return {
			signing: false,
			user: null,
			username: '',
			password: '',
			token: '',
			apiUrl,
			host: toUnicode(host),
			totpLogin: false,
			credential: null,
			challengeData: null,
			queryingKey: false,
		};
	},

	computed: {
		meta() {
			return this.$instance;
		},
	},

	methods: {
		onUsernameChange() {
			os.api('users/show', {
				username: this.username
			}).then(user => {
				this.user = user;
			}, () => {
				this.user = null;
			});
		},

		onLogin(res) {
			if (this.autoSet) {
				login(res.i);
			}
		},

		queryKey() {
			this.queryingKey = true;
			return navigator.credentials.get({
				publicKey: {
					challenge: byteify(this.challengeData.challenge, 'base64'),
					allowCredentials: this.challengeData.securityKeys.map(key => ({
						id: byteify(key.id, 'hex'),
						type: 'public-key',
						transports: ['usb', 'nfc', 'ble', 'internal']
					})),
					timeout: 60 * 1000
				}
			}).catch(() => {
				this.queryingKey = false;
				return Promise.reject(null);
			}).then(credential => {
				this.queryingKey = false;
				this.signing = true;
				return os.api('signin', {
					username: this.username,
					password: this.password,
					signature: hexify(credential.response.signature),
					authenticatorData: hexify(credential.response.authenticatorData),
					clientDataJSON: hexify(credential.response.clientDataJSON),
					credentialId: credential.id,
					challengeId: this.challengeData.challengeId
				});
			}).then(res => {
				this.$emit('login', res);
				this.onLogin(res);
			}).catch(err => {
				if (err === null) return;
				os.dialog({
					type: 'error',
					text: this.$ts.signinFailed
				});
				this.signing = false;
			});
		},

		onSubmit() {
			this.signing = true;
			if (!this.totpLogin && this.user && this.user.twoFactorEnabled) {
				if (window.PublicKeyCredential && this.user.securityKeys) {
					os.api('signin', {
						username: this.username,
						password: this.password
					}).then(res => {
						this.totpLogin = true;
						this.signing = false;
						this.challengeData = res;
						return this.queryKey();
					}).catch(() => {
						os.dialog({
							type: 'error',
							text: this.$ts.signinFailed
						});
						this.challengeData = null;
						this.totpLogin = false;
						this.signing = false;
					});
				} else {
					this.totpLogin = true;
					this.signing = false;
				}
			} else {
				os.api('signin', {
					username: this.username,
					password: this.password,
					token: this.user && this.user.twoFactorEnabled ? this.token : undefined
				}).then(res => {
					this.$emit('login', res);
					this.onLogin(res);
				}).catch(() => {
					os.dialog({
						type: 'error',
						text: this.$ts.loginFailed
					});
					this.signing = false;
				});
			}
		}
	}
});
</script>

<style lang="scss" scoped>
.eppvobhk {
	> .auth {
		> .avatar {
			margin: 0 auto 0 auto;
			width: 64px;
			height: 64px;
			background: #ddd;
			background-position: center;
			background-size: cover;
			border-radius: 100%;
		}
	}
}
</style>
