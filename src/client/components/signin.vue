<template>
<form class="eppvobhk" :class="{ signing, totpLogin }" @submit.prevent="onSubmit">
	<div class="avatar" :style="{ backgroundImage: user ? `url('${ user.avatarUrl }')` : null }" v-show="withAvatar"></div>
	<div class="normal-signin" v-if="!totpLogin">
		<x-input v-model="username" type="text" pattern="^[a-zA-Z0-9_]+$" spellcheck="false" autofocus required @input="onUsernameChange">
			<span>{{ $t('username') }}</span>
			<template #prefix>@</template>
			<template #suffix>@{{ host }}</template>
		</x-input>
		<x-input v-model="password" type="password" :with-password-toggle="true" v-if="!user || user && !user.usePasswordLessLogin" required>
			<span>{{ $t('password') }}</span>
			<template #prefix><fa icon="lock"/></template>
		</x-input>
		<x-button type="submit" :disabled="signing">{{ signing ? $t('signing-in') : $t('@.signin') }}</x-button>
		<p v-if="meta && meta.enableTwitterIntegration" style="margin: 8px 0;"><a :href="`${apiUrl}/signin/twitter`"><fa :icon="['fab', 'twitter']"/> {{ $t('signin-with-twitter') }}</a></p>
		<p v-if="meta && meta.enableGithubIntegration"  style="margin: 8px 0;"><a :href="`${apiUrl}/signin/github`"><fa :icon="['fab', 'github']"/> {{ $t('signin-with-github') }}</a></p>
		<p v-if="meta && meta.enableDiscordIntegration" style="margin: 8px 0;"><a :href="`${apiUrl}/signin/discord`"><fa :icon="['fab', 'discord']"/> {{ $t('signin-with-discord') /* TODO: Make these layouts better */ }}</a></p>
	</div>
	<div class="2fa-signin" v-if="totpLogin" :class="{ securityKeys: user && user.securityKeys }">
		<div v-if="user && user.securityKeys" class="twofa-group tap-group">
			<p>{{ $t('tap-key') }}</p>
			<x-button @click="queryKey" v-if="!queryingKey">
				{{ $t('@.error.retry') }}
			</x-button>
		</div>
		<div class="or-hr" v-if="user && user.securityKeys">
			<p class="or-msg">{{ $t('or') }}</p>
		</div>
		<div class="twofa-group totp-group">
			<p style="margin-bottom:0;">{{ $t('enter-2fa-code') }}</p>
			<x-input v-model="password" type="password" :with-password-toggle="true" v-if="user && user.usePasswordLessLogin" required>
				<span>{{ $t('password') }}</span>
				<template #prefix><fa icon="lock"/></template>
			</x-input>
			<x-input v-model="token" type="text" pattern="^[0-9]{6}$" autocomplete="off" spellcheck="false" required>
				<span>{{ $t('@.2fa') }}</span>
				<template #prefix><fa icon="gavel"/></template>
			</x-input>
			<x-button type="submit" :disabled="signing">{{ signing ? $t('signing-in') : $t('@.signin') }}</x-button>
		</div>
	</div>
</form>
</template>

<script lang="ts">
import Vue from 'vue';
import { toUnicode } from 'punycode';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import XButton from '../components/ui/button.vue';
import XInput from '../components/ui/input.vue';
import i18n from '../i18n';
import { apiUrl, host } from '../config';
import { hexifyAB } from '../scripts/2fa';

export default Vue.extend({
	i18n,

	components: {
		XButton,
		XInput,
	},

	props: {
		withAvatar: {
			type: Boolean,
			required: false,
			default: true
		}
	},

	data() {
		return {
			signing: false,
			user: null,
			username: '',
			password: '',
			token: '',
			apiUrl,
			host: toUnicode(host),
			meta: null,
			totpLogin: false,
			credential: null,
			challengeData: null,
			queryingKey: false,
			faLock
		};
	},

	created() {
		this.$root.getMeta().then(meta => {
			this.meta = meta;
		});
	},

	methods: {
		onUsernameChange() {
			this.$root.api('users/show', {
				username: this.username
			}).then(user => {
				this.user = user;
			}, () => {
				this.user = null;
			});
		},

		queryKey() {
			this.queryingKey = true;
			return navigator.credentials.get({
				publicKey: {
					challenge: Buffer.from(
						this.challengeData.challenge
							.replace(/\-/g, '+')
							.replace(/_/g, '/'),
							'base64'
					),
					allowCredentials: this.challengeData.securityKeys.map(key => ({
						id: Buffer.from(key.id, 'hex'),
						type: 'public-key',
						transports: ['usb', 'ble', 'nfc']
					})),
					timeout: 60 * 1000
				}
			}).catch(() => {
				this.queryingKey = false;
				return Promise.reject(null);
			}).then(credential => {
				this.queryingKey = false;
				this.signing = true;
				return this.$root.api('signin', {
					username: this.username,
					password: this.password,
					signature: hexifyAB(credential.response.signature),
					authenticatorData: hexifyAB(credential.response.authenticatorData),
					clientDataJSON: hexifyAB(credential.response.clientDataJSON),
					credentialId: credential.id,
					challengeId: this.challengeData.challengeId
				});
			}).then(res => {
				localStorage.setItem('i', res.i);
				location.reload();
			}).catch(err => {
				if (err === null) return;
				this.$root.dialog({
					type: 'error',
					text: this.$t('login-failed')
				});
				this.signing = false;
			});
		},

		onSubmit() {
			this.signing = true;
			if (!this.totpLogin && this.user && this.user.twoFactorEnabled) {
				if (window.PublicKeyCredential && this.user.securityKeys) {
					this.$root.api('signin', {
						username: this.username,
						password: this.password
					}).then(res => {
						this.totpLogin = true;
						this.signing = false;
						this.challengeData = res;
						return this.queryKey();
					}).catch(() => {
						this.$root.dialog({
							type: 'error',
							text: this.$t('login-failed')
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
				this.$root.api('signin', {
					username: this.username,
					password: this.password,
					token: this.user && this.user.twoFactorEnabled ? this.token : undefined
				}).then(res => {
					localStorage.setItem('i', res.i);
					location.reload();
				}).catch(() => {
					this.$root.dialog({
						type: 'error',
						text: this.$t('loginFailed')
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
	box-sizing: border-box;
	overflow: hidden;
	padding: 32px;

	> .avatar {
		margin: 0 auto 0 auto;
		width: 64px;
		height: 64px;
		background: #ddd;
		background-position: center;
		background-size: cover;
		border-radius: 100%;
	}

	> div {
		> footer {
			> * {
				margin: 0 auto;
			}
		}
	}
}
</style>
