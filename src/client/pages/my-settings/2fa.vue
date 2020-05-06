<template>
<section class="_card">
	<div class="_title"><fa :icon="faLock"/> {{ $t('twoStepAuthentication') }}</div>
	<div class="_content">
		<p v-if="!data && !$store.state.i.twoFactorEnabled"><mk-button @click="register">{{ $t('_2fa.registerDevice') }}</mk-button></p>
		<template v-if="$store.state.i.twoFactorEnabled">
			<p>{{ $t('_2fa.alreadyRegistered') }}</p>
			<mk-button @click="unregister">{{ $t('unregister') }}</mk-button>

			<template v-if="supportsCredentials">
				<hr class="totp-method-sep">

				<h2 class="heading">{{ $t('securityKey') }}</h2>
				<p>{{ $t('_2fa.securityKeyInfo') }}</p>
				<div class="key-list">
					<div class="key" v-for="key in $store.state.i.securityKeysList">
						<h3>{{ key.name }}</h3>
						<div class="last-used">{{ $t('lastUsed') }}<mk-time :time="key.lastUsed"/></div>
						<mk-button @click="unregisterKey(key)">{{ $t('unregister') }}</mk-button>
					</div>
				</div>

				<mk-switch v-model="usePasswordLessLogin" @change="updatePasswordLessLogin" v-if="$store.state.i.securityKeysList.length > 0">{{ $t('passwordLessLogin') }}</mk-switch>

				<mk-info warn v-if="registration && registration.error">{{ $t('something-went-wrong') }} {{ registration.error }}</mk-info>
				<mk-button v-if="!registration || registration.error" @click="addSecurityKey">{{ $t('_2fa.registerKey') }}</mk-button>

				<ol v-if="registration && !registration.error">
					<li v-if="registration.stage >= 0">
						{{ $t('activate-key') }}
						<fa icon="spinner" pulse fixed-width v-if="registration.saving && registration.stage == 0" />
					</li>
					<li v-if="registration.stage >= 1">
						<mk-form :disabled="registration.stage != 1 || registration.saving">
							<mk-input v-model="keyName" :max="30">
								<span>{{ $t('securityKeyName') }}</span>
							</mk-input>
							<mk-button @click="registerKey" :disabled="keyName.length == 0">{{ $t('registerSecurityKey') }}</mk-button>
							<fa icon="spinner" pulse fixed-width v-if="registration.saving && registration.stage == 1" />
						</mk-form>
					</li>
				</ol>
			</template>
		</template>
		<div v-if="data && !$store.state.i.twoFactorEnabled">
			<ol style="margin: 0; padding: 0 0 0 1em;">
				<li>
					<i18n path="_2fa.step1" tag="span">
						<a href="https://authy.com/" rel="noopener" target="_blank" place="a" class="_link">Authy</a>
						<a href="https://support.google.com/accounts/answer/1066447" rel="noopener" target="_blank" place="b" class="_link">Google Authenticator</a>
					</i18n>
				</li>
				<li>{{ $t('_2fa.step2') }}<br><img :src="data.qr"></li>
				<li>{{ $t('_2fa.step3') }}<br>
					<mk-input v-model="token" type="text" pattern="^[0-9]{6}$" autocomplete="off" spellcheck="false">{{ $t('token') }}</mk-input>
					<mk-button primary @click="submit">{{ $t('done') }}</mk-button>
				</li>
			</ol>
			<mk-info>{{ $t('_2fa.step4') }}</mk-info>
		</div>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import i18n from '../../i18n';
import { hostname } from '../../config';
import { hexifyAB } from '../../scripts/2fa';
import MkButton from '../../components/ui/button.vue';
import MkInfo from '../../components/ui/info.vue';
import MkInput from '../../components/ui/input.vue';
import MkSwitch from '../../components/ui/switch.vue';

function stringifyAB(buffer) {
	return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

export default Vue.extend({
	i18n,
	components: {
		MkButton, MkInfo, MkInput, MkSwitch
	},
	data() {
		return {
			data: null,
			supportsCredentials: !!navigator.credentials,
			usePasswordLessLogin: this.$store.state.i.usePasswordLessLogin,
			registration: null,
			keyName: '',
			token: null,
			faLock
		};
	},
	methods: {
		register() {
			this.$root.dialog({
				title: this.$t('password'),
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
				title: this.$t('password'),
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
					this.$root.dialog({
						type: 'success',
						iconOnly: true, autoClose: true
					});
					this.$store.state.i.twoFactorEnabled = false;
				});
			});
		},

		submit() {
			this.$root.api('i/2fa/done', {
				token: this.token
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
				this.$store.state.i.twoFactorEnabled = true;
			}).catch(e => {
				this.$root.dialog({
					type: 'error',
					iconOnly: true, autoClose: true
				});
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
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			})
		},

		unregisterKey(key) {
			this.$root.dialog({
				title: this.$t('password'),
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
					this.$root.dialog({
						type: 'success',
						iconOnly: true, autoClose: true
					});
				});
			});
		},

		addSecurityKey() {
			this.$root.dialog({
				title: this.$t('password'),
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
							challenge: Uint8Array.from(
								atob(registration.challenge
									.replace(/\-/g, '+')
									.replace(/_/g, '/')),
								x => x.charCodeAt(0),
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
							pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
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
