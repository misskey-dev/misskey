<template>
<form class="eppvobhk _monolithic_" :class="{ signing, totpLogin }" @submit.prevent="onSubmit">
	<div class="auth _section _formRoot">
		<div v-show="withAvatar" class="avatar" :style="{ backgroundImage: user ? `url('${ user.avatarUrl }')` : null }"></div>
		<div v-if="!totpLogin" class="normal-signin">
			<MkInput v-model="username" class="_formBlock" :placeholder="$ts.username" type="text" pattern="^[a-zA-Z0-9_]+$" spellcheck="false" autofocus required data-cy-signin-username @update:modelValue="onUsernameChange">
				<template #prefix>@</template>
				<template #suffix>@{{ host }}</template>
			</MkInput>
			<MkInput v-if="!user || user && !user.usePasswordLessLogin" v-model="password" class="_formBlock" :placeholder="$ts.password" type="password" :with-password-toggle="true" required data-cy-signin-password>
				<template #prefix><i class="fas fa-lock"></i></template>
				<template #caption><button class="_textButton" type="button" @click="resetPassword">{{ $ts.forgotPassword }}</button></template>
			</MkInput>
			<MkButton class="_formBlock" type="submit" primary :disabled="signing" style="margin: 0 auto;">{{ signing ? $ts.loggingIn : $ts.login }}</MkButton>
		</div>
		<div v-if="totpLogin" class="2fa-signin" :class="{ securityKeys: user && user.securityKeys }">
			<div v-if="user && user.securityKeys" class="twofa-group tap-group">
				<p>{{ $ts.tapSecurityKey }}</p>
				<MkButton v-if="!queryingKey" @click="queryKey">
					{{ $ts.retry }}
				</MkButton>
			</div>
			<div v-if="user && user.securityKeys" class="or-hr">
				<p class="or-msg">{{ $ts.or }}</p>
			</div>
			<div class="twofa-group totp-group">
				<p style="margin-bottom:0;">{{ $ts.twoStepAuthentication }}</p>
				<MkInput v-if="user && user.usePasswordLessLogin" v-model="password" type="password" :with-password-toggle="true" required>
					<template #label>{{ $ts.password }}</template>
					<template #prefix><i class="fas fa-lock"></i></template>
				</MkInput>
				<MkInput v-model="token" type="text" pattern="^[0-9]{6}$" autocomplete="off" spellcheck="false" required>
					<template #label>{{ $ts.token }}</template>
					<template #prefix><i class="fas fa-gavel"></i></template>
				</MkInput>
				<MkButton type="submit" :disabled="signing" primary style="margin: 0 auto;">{{ signing ? $ts.loggingIn : $ts.login }}</MkButton>
			</div>
		</div>
	</div>
	<div class="social _section">
		<a v-if="meta && meta.enableTwitterIntegration" class="_borderButton _gap" :href="`${apiUrl}/signin/twitter`"><i class="fab fa-twitter" style="margin-right: 4px;"></i>{{ $t('signinWith', { x: 'Twitter' }) }}</a>
		<a v-if="meta && meta.enableGithubIntegration" class="_borderButton _gap" :href="`${apiUrl}/signin/github`"><i class="fab fa-github" style="margin-right: 4px;"></i>{{ $t('signinWith', { x: 'GitHub' }) }}</a>
		<a v-if="meta && meta.enableDiscordIntegration" class="_borderButton _gap" :href="`${apiUrl}/signin/discord`"><i class="fab fa-discord" style="margin-right: 4px;"></i>{{ $t('signinWith', { x: 'Discord' }) }}</a>
	</div>
</form>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { toUnicode } from 'punycode/';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/form/input.vue';
import { apiUrl, host } from '@/config';
import { byteify, hexify } from '@/scripts/2fa';
import * as os from '@/os';
import { login } from '@/account';
import { showSuspendedDialog } from '../scripts/show-suspended-dialog';

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
				return login(res.i);
			} else {
				return;
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
				return this.onLogin(res);
			}).catch(err => {
				if (err === null) return;
				os.alert({
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
					}).catch(this.loginFailed);
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
				}).catch(this.loginFailed);
			}
		},

		loginFailed(err) {
			switch (err.id) {
				case '6cc579cc-885d-43d8-95c2-b8c7fc963280': {
					os.alert({
						type: 'error',
						title: this.$ts.loginFailed,
						text: this.$ts.noSuchUser
					});
					break;
				}
				case '932c904e-9460-45b7-9ce6-7ed33be7eb2c': {
					os.alert({
						type: 'error',
						title: this.$ts.loginFailed,
						text: this.$ts.incorrectPassword,
					});
					break;
				}
				case 'e03a5f46-d309-4865-9b69-56282d94e1eb': {
					showSuspendedDialog();
					break;
				}
				default: {
					os.alert({
						type: 'error',
						title: this.$ts.loginFailed,
						text: JSON.stringify(err)
					});
				}
			}

			this.challengeData = null;
			this.totpLogin = false;
			this.signing = false;
		},

		resetPassword() {
			os.popup(import('@/components/forgot-password.vue'), {}, {
			}, 'closed');
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
