<template>
<section class="_card">
	<div class="_title"><Fa :icon="faLock"/> {{ $t('twoStepAuthentication') }}</div>
	<div class="_content">
		<MkButton v-if="!data && !$store.state.i.twoFactorEnabled" @click="register">{{ $t('_2fa.registerDevice') }}</MkButton>
		<template v-if="$store.state.i.twoFactorEnabled">
			<p>{{ $t('_2fa.alreadyRegistered') }}</p>
			<MkButton @click="unregister">{{ $t('unregister') }}</MkButton>

			<template v-if="supportsCredentials">
				<hr class="totp-method-sep">

				<h2 class="heading">{{ $t('securityKey') }}</h2>
				<p>{{ $t('_2fa.securityKeyInfo') }}</p>
				<div class="key-list">
					<div class="key" v-for="key in $store.state.i.securityKeysList">
						<h3>{{ key.name }}</h3>
						<div class="last-used">{{ $t('lastUsed') }}<MkTime :time="key.lastUsed"/></div>
						<MkButton @click="unregisterKey(key)">{{ $t('unregister') }}</MkButton>
					</div>
				</div>

				<MkSwitch v-model:value="usePasswordLessLogin" @update:value="updatePasswordLessLogin" v-if="$store.state.i.securityKeysList.length > 0">{{ $t('passwordLessLogin') }}</MkSwitch>

				<MkInfo warn v-if="registration && registration.error">{{ $t('error') }} {{ registration.error }}</MkInfo>
				<MkButton v-if="!registration || registration.error" @click="addSecurityKey">{{ $t('_2fa.registerKey') }}</MkButton>

				<ol v-if="registration && !registration.error">
					<li v-if="registration.stage >= 0">
						{{ $t('tapSecurityKey') }}
						<Fa icon="spinner" pulse fixed-width v-if="registration.saving && registration.stage == 0" />
					</li>
					<li v-if="registration.stage >= 1">
						<MkForm :disabled="registration.stage != 1 || registration.saving">
							<MkInput v-model:value="keyName" :max="30">
								<span>{{ $t('securityKeyName') }}</span>
							</MkInput>
							<MkButton @click="registerKey" :disabled="keyName.length == 0">{{ $t('registerSecurityKey') }}</MkButton>
							<Fa icon="spinner" pulse fixed-width v-if="registration.saving && registration.stage == 1" />
						</MkForm>
					</li>
				</ol>
			</template>
		</template>
		<div v-if="data && !$store.state.i.twoFactorEnabled">
			<ol style="margin: 0; padding: 0 0 0 1em;">
				<li>
					<i18n-t keypath="_2fa.step1" tag="span">
						<template #a>
							<a href="https://authy.com/" rel="noopener" target="_blank" class="_link">Authy</a>
						</template>
						<template #b>
							<a href="https://support.google.com/accounts/answer/1066447" rel="noopener" target="_blank" class="_link">Google Authenticator</a>
						</template>
					</i18n-t>
				</li>
				<li>{{ $t('_2fa.step2') }}<br><img :src="data.qr"></li>
				<li>{{ $t('_2fa.step3') }}<br>
					<MkInput v-model:value="token" type="text" pattern="^[0-9]{6}$" autocomplete="off" spellcheck="false">{{ $t('token') }}</MkInput>
					<MkButton primary @click="submit">{{ $t('done') }}</MkButton>
				</li>
			</ol>
			<MkInfo>{{ $t('_2fa.step4') }}</MkInfo>
		</div>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { hostname } from '@/config';
import { byteify, hexify, stringify } from '@/scripts/2fa';
import MkButton from '@/components/ui/button.vue';
import MkInfo from '@/components/ui/info.vue';
import MkInput from '@/components/ui/input.vue';
import MkSwitch from '@/components/ui/switch.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import FormButton from '@/components/form/button.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		FormBase,
		MkButton, MkInfo, MkInput, MkSwitch
	},

	emits: ['info'],

	data() {
		return {
			INFO: {
				title: this.$t('twoStepAuthentication'),
				icon: faLock
			},
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
			os.dialog({
				title: this.$t('password'),
				input: {
					type: 'password'
				}
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				os.api('i/2fa/register', {
					password: password
				}).then(data => {
					this.data = data;
				});
			});
		},

		unregister() {
			os.dialog({
				title: this.$t('password'),
				input: {
					type: 'password'
				}
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				os.api('i/2fa/unregister', {
					password: password
				}).then(() => {
					this.usePasswordLessLogin = false;
					this.updatePasswordLessLogin();
				}).then(() => {
					os.success();
					this.$store.state.i.twoFactorEnabled = false;
				});
			});
		},

		submit() {
			os.api('i/2fa/done', {
				token: this.token
			}).then(() => {
				os.success();
				this.$store.state.i.twoFactorEnabled = true;
			}).catch(e => {
				os.dialog({
					type: 'error',
					text: e
				});
			});
		},

		registerKey() {
			this.registration.saving = true;
			os.api('i/2fa/key-done', {
				password: this.registration.password,
				name: this.keyName,
				challengeId: this.registration.challengeId,
				// we convert each 16 bits to a string to serialise
				clientDataJSON: stringify(this.registration.credential.response.clientDataJSON),
				attestationObject: hexify(this.registration.credential.response.attestationObject)
			}).then(key => {
				this.registration = null;
				key.lastUsed = new Date();
				os.success();
			})
		},

		unregisterKey(key) {
			os.dialog({
				title: this.$t('password'),
				input: {
					type: 'password'
				}
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				return os.api('i/2fa/remove-key', {
					password,
					credentialId: key.id
				}).then(() => {
					this.usePasswordLessLogin = false;
					this.updatePasswordLessLogin();
				}).then(() => {
					os.success();
				});
			});
		},

		addSecurityKey() {
			os.dialog({
				title: this.$t('password'),
				input: {
					type: 'password'
				}
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				os.api('i/2fa/register-key', {
					password
				}).then(registration => {
					this.registration = {
						password,
						challengeId: registration.challengeId,
						stage: 0,
						publicKeyOptions: {
							challenge: byteify(registration.challenge, 'base64'),
							rp: {
								id: hostname,
								name: 'Misskey'
							},
							user: {
								id: byteify(this.$store.state.i.id, 'ascii'),
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
			os.api('i/2fa/password-less', {
				value: !!this.usePasswordLessLogin
			});
		}
	}
});
</script>
