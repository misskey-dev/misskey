<template>
<div class="2fa totp-section">
	<p style="margin-top:0;">{{ $t('intro') }}<a :href="$t('url')" target="_blank">{{ $t('detail') }}</a></p>
	<ui-info warn>{{ $t('caution') }}</ui-info>
	<p v-if="!data && !$store.state.i.twoFactorEnabled"><ui-button @click="register">{{ $t('register') }}</ui-button></p>
	<template v-if="$store.state.i.twoFactorEnabled">
		<h2 class="heading">{{ $t('totp-header') }}</h2>
		<p>{{ $t('already-registered') }}</p>
		<ui-button @click="unregister">{{ $t('unregister') }}</ui-button>

		<template v-if="supportsCredentials">
			<hr class="totp-method-sep">

			<h2 class="heading">{{ $t('security-key-header') }}</h2>
			<p>{{ $t('security-key') }}</p>
			<div class="key-list">
				<div class="key" v-for="key in $store.state.i.securityKeysList">
					<h3>
						{{ key.name }}
					</h3>
					<div class="last-used">
						{{ $t('last-used') }}
						<mk-time :time="key.lastUsed"/>
					</div>
					<ui-button @click="unregisterKey(key)">
						{{ $t('unregister') }}
					</ui-button>
				</div>
			</div>

			<ui-switch v-model="usePasswordLessLogin" @change="updatePasswordLessLogin" v-if="$store.state.i.securityKeysList.length > 0">
				{{ $t('use-password-less-login') }}
			</ui-switch>

			<ui-info warn v-if="registration && registration.error">{{ $t('something-went-wrong') }} {{ registration.error }}</ui-info>
			<ui-button v-if="!registration || registration.error" @click="addSecurityKey">{{ $t('register') }}</ui-button>

			<ol v-if="registration && !registration.error">
				<li v-if="registration.stage >= 0">
					{{ $t('activate-key') }}
					<fa icon="spinner" pulse fixed-width v-if="registration.saving && registration.stage == 0" />
				</li>
				<li v-if="registration.stage >= 1">
					<ui-form :disabled="registration.stage != 1 || registration.saving">
						<ui-input v-model="keyName" :max="30">
							<span>{{ $t('security-key-name') }}</span>
						</ui-input>
						<ui-button @click="registerKey" :disabled="this.keyName.length == 0">
							{{ $t('register-security-key') }}
						</ui-button>
						<fa icon="spinner" pulse fixed-width v-if="registration.saving && registration.stage == 1" />
					</ui-form>
				</li>
			</ol>
		</template>
	</template>
	<div v-if="data && !$store.state.i.twoFactorEnabled">
		<ol>
			<li>{{ $t('authenticator') }}<a href="https://support.google.com/accounts/answer/1066447" rel="noopener" target="_blank">{{ $t('howtoinstall') }}</a></li>
			<li>{{ $t('scan') }}<br><img :src="data.qr"></li>
			<li>{{ $t('done') }}<br>
				<ui-input v-model="token">{{ $t('token') }}</ui-input>
				<ui-button primary @click="submit">{{ $t('submit') }}</ui-button>
			</li>
		</ol>
		<ui-info>{{ $t('info') }}</ui-info>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import { hostname } from '../../../../config';
import { hexifyAB } from '../../../scripts/2fa';

function stringifyAB(buffer) {
	return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

export default Vue.extend({
	i18n: i18n('desktop/views/components/settings.2fa.vue'),
	data() {
		return {
			data: null,
			supportsCredentials: !!navigator.credentials,
			usePasswordLessLogin: this.$store.state.i.usePasswordLessLogin,
			registration: null,
			keyName: '',
			token: null
		};
	},
	methods: {
		register() {
			this.$root.dialog({
				title: this.$t('enter-password'),
				input: {
					type: 'password'
				}
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				this.$root.api('i/2fa/register', {
					password: password
				}).then(data => {
					this.data = data;
				});
			});
		},

		unregister() {
			this.$root.dialog({
				title: this.$t('enter-password'),
				input: {
					type: 'password'
				}
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				this.$root.api('i/2fa/unregister', {
					password: password
				}).then(() => {
					this.usePasswordLessLogin = false;
					this.updatePasswordLessLogin();
				}).then(() => {
					this.$notify(this.$t('unregistered'));
					this.$store.state.i.twoFactorEnabled = false;
				});
			});
		},

		submit() {
			this.$root.api('i/2fa/done', {
				token: this.token
			}).then(() => {
				this.$notify(this.$t('success'));
				this.$store.state.i.twoFactorEnabled = true;
			}).catch(() => {
				this.$notify(this.$t('failed'));
			});
		},

		registerKey() {
			this.registration.saving = true;
			this.$root.api('i/2fa/key-done', {
				password: this.registration.password,
				name: this.keyName,
				challengeId: this.registration.challengeId,
				// we convert each 16 bits to a string to serialise
				clientDataJSON: stringifyAB(this.registration.credential.response.clientDataJSON),
				attestationObject: hexifyAB(this.registration.credential.response.attestationObject)
			}).then(key => {
				this.registration = null;
				key.lastUsed = new Date();
				this.$notify(this.$t('success'));
			})
		},

		unregisterKey(key) {
			this.$root.dialog({
				title: this.$t('enter-password'),
				input: {
					type: 'password'
				}
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				return this.$root.api('i/2fa/remove-key', {
					password,
					credentialId: key.id
				}).then(() => {
					this.usePasswordLessLogin = false;
					this.updatePasswordLessLogin();
				}).then(() => {
					this.$notify(this.$t('key-unregistered'));
				});
			});
		},

		addSecurityKey() {
			this.$root.dialog({
				title: this.$t('enter-password'),
				input: {
					type: 'password'
				}
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				this.$root.api('i/2fa/register-key', {
					password
				}).then(registration => {
					this.registration = {
						password,
						challengeId: registration.challengeId,
						stage: 0,
						publicKeyOptions: {
							challenge: Buffer.from(
								registration.challenge
									.replace(/\-/g, "+")
									.replace(/_/g, "/"),
								'base64'
							),
							rp: {
								id: hostname,
								name: 'Misskey'
							},
							user: {
								id: Uint8Array.from(this.$store.state.i.id, c => c.charCodeAt(0)),
								name: this.$store.state.i.username,
								displayName: this.$store.state.i.name,
							},
							pubKeyCredParams: [{alg: -7, type: 'public-key'}],
							timeout: 60000,
							attestation: 'direct'
						},
						saving: true
					};
					return navigator.credentials.create({
						publicKey: this.registration.publicKeyOptions
					});
				}).then(credential => {
					this.registration.credential = credential;
					this.registration.saving = false;
					this.registration.stage = 1;
				}).catch(err => {
					console.warn('Error while registering?', err);
					this.registration.error = err.message;
					this.registration.stage = -1;
				});
			});
		},
		updatePasswordLessLogin() {
			this.$root.api('i/2fa/password-less', {
				value: !!this.usePasswordLessLogin
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.totp-section
	.totp-method-sep
		margin 1.5em 0 1em
		border none
		border-top solid var(--lineWidth) var(--faceDivider)

	h2.heading
		margin 0

	.key
		padding 1em
		margin 0.5em 0
		background #161616
		border-radius 6px

		h3
			margin-top 0
			margin-bottom .3em

		.last-used
			margin-bottom .5em
</style>
