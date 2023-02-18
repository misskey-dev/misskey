<template>
<div class="_gaps_m" v-if="$i">
	<FormSection :first="first">
		<template #label>{{ i18n.ts.twoStepAuthentication }}</template>

		<template v-if="$i.twoFactorEnabled">
			<p>{{ i18n.ts._2fa.alreadyRegistered }}</p>
			<template v-if="$i.securityKeysList.length > 0">
				<MkButton @click="renewTOTP">{{ i18n.ts._2fa.renewTOTP }}</MkButton>
				<MkInfo>{{ i18n.ts._2fa.whyTOTPOnlyRenew }}</MkInfo>
			</template>
			<MkButton @click="unregisterTOTP">{{ i18n.ts.unregister }}</MkButton>
		</template>

		<MkButton v-else-if="!twoFactorData && !$i.twoFactorEnabled" @click="registerTOTP">{{ i18n.ts._2fa.registerTOTP }}</MkButton>

		<div v-else-if="twoFactorData && !$i.twoFactorEnabled">
			<ol style="margin: 0; padding: 0 0 0 1em;">
				<li>
					<I18n :src="i18n.ts._2fa.step1" tag="span">
						<template #a>
							<a href="https://authy.com/" rel="noopener" target="_blank" class="_link">Authy</a>
						</template>
						<template #b>
							<a href="https://support.google.com/accounts/answer/1066447" rel="noopener" target="_blank" class="_link">Google Authenticator</a>
						</template>
					</I18n>
				</li>
				<li></li>
				<li>
					{{ i18n.ts._2fa.step3 }}<br>
					<MkInput :model-value="token" type="text" pattern="^[0-9]{6}$" autocomplete="off" :spellcheck="false"><template #label>{{ i18n.ts.token }}</template></MkInput>
					<MkButton primary @click="submit">{{ i18n.ts.done }}</MkButton>
				</li>
			</ol>
			<MkInfo>{{ i18n.ts._2fa.step4 }}</MkInfo>
		</div>
	</FormSection>

	<FormSection>
		<template #label>{{ i18n.ts.securityKeyAndPasskey }}</template>

		<MkInfo v-if="!supportsCredentials" warn>
			{{ i18n.ts._2fa.securityKeyNotSupported }}
		</MkInfo>

		<MkInfo v-else-if="supportsCredentials && !$i.twoFactorEnabled" warn>
			{{ i18n.ts._2fa.registerTOTPBeforeKey }}
		</MkInfo>

		<template v-else>
			<div :class="$style.keyList" class="_gaps_s">
				<div v-for="key in $i.securityKeysList" :key="key.id" :class="$style.key">
					<h3>{{ key.name }}</h3>
					<div :class="$style.keyLastUsed">{{ i18n.ts.lastUsed }}<MkTime :time="key.lastUsed"/></div>
					<MkButton @click="unregisterKey(key)">{{ i18n.ts.unregister }}</MkButton>
				</div>
			</div>
			<FormSection class="_gaps_s">
				<MkSwitch v-if="$i.securityKeysList.length > 0" :model-value="usePasswordLessLogin" @update:model-value="updatePasswordLessLogin">{{ i18n.ts.passwordLessLogin }}</MkSwitch>
				<MkButton @click="addSecurityKey">{{ i18n.ts._2fa.registerSecurityKey }}</MkButton>
			</FormSection>
		</template>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { hostname } from '@/config';
import { byteify, hexify, stringify } from '@/scripts/2fa';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormSection from '@/components/form/section.vue';
import * as os from '@/os';
import { $i, refreshAccount } from '@/account';
import { i18n } from '@/i18n';

withDefaults(defineProps<{
	first?: boolean;
}>(), {
	first: false,
})

const twoFactorData = ref<any>(null);
const supportsCredentials = ref(!!navigator.credentials);
const usePasswordLessLogin = ref($i!.usePasswordLessLogin);
const token = ref<string>('');

function registerTOTP() {
	os.inputText({
		title: i18n.ts.password,
		type: 'password',
	}).then(({ canceled, result: password }) => {
		if (canceled) return;
		os.apiWithDialog('i/2fa/register', {
			password: password,
		}).then(data => {
			twoFactorData.value = data;
		});
	});
}

function unregisterTOTP() {
	os.inputText({
		title: i18n.ts.password,
		type: 'password',
	}).then(({ canceled, result: password }) => {
		if (canceled) return;
		os.apiWithDialog('i/2fa/unregister', {
			password: password,
		}).then(() => {
			usePasswordLessLogin.value = false;
			updatePasswordLessLogin();
		}).then(() => {
			os.success();
			refreshAccount();
		});
	});
}

function renewTOTP() {
	os.confirm({
		type: 'question',
		title: i18n.ts._2fa.renewTOTP,
		text: i18n.ts._2fa.renewTOTPConfirm,
		okText: i18n.ts._2fa.renewTOTPOk,
		cancelText: i18n.ts._2fa.renewTOTPCancel,
	}).then(({ canceled }) => {
		if (canceled) return;
		registerTOTP();
	});
}

function submit() {
	os.apiWithDialog('i/2fa/done', {
		token: token.value,
	}).then(() => {
		os.success();
		$i!.twoFactorEnabled = true;
	}).catch(err => {
		os.alert({
			type: 'error',
			text: err,
		});
	});
}

async function unregisterKey(key) {
	const confirm = await os.confirm({
		type: 'question',
		title: i18n.ts._2fa.removeKey,
		text: i18n.t('_2fa.removeKeyConfirm', { name: key.name }),
	});
	if (confirm.canceled) return;

	const password = await os.inputText({
		title: i18n.ts.password,
		type: 'password',
	});
	if (password.canceled) return;

	await os.apiWithDialog('i/2fa/remove-key', {
		password: password.result,
		credentialId: key.id,
	});
	usePasswordLessLogin.value = false;
	await updatePasswordLessLogin();
	os.success();
}

async function addSecurityKey() {
	const password = await os.inputText({
		title: i18n.ts.password,
		type: 'password',
	})
	if (password.canceled) return;

	const challenge: any = await os.apiWithDialog('i/2fa/register-key', {
		password: password.result,
	});

	const name = await os.inputText({
		title: i18n.ts._2fa.registerSecurityKey,
		text: i18n.ts._2fa.securityKeyName,
		type: 'text',
		minLength: 1,
		maxLength: 30,
	});
	if (name.canceled) return;

	const credential = await os.promiseDialog(navigator.credentials.create({
			publicKey: {
				challenge: byteify(challenge.challenge, 'base64'),
				rp: {
					id: hostname,
					name: 'Misskey',
				},
				user: {
					id: byteify($i!.id, 'ascii'),
					name: $i!.username,
					displayName: $i!.name,
				},
				pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
				timeout: 60000,
				attestation: 'direct',
			},
		}),
		null,
		null,
		i18n.ts._2fa.tapSecurityKey,
	) as PublicKeyCredential & { response: AuthenticatorAttestationResponse; } | null;
	if (!credential) return;

	await os.apiWithDialog('i/2fa/key-done', {
		password: password.result,
		name: name.result,
		challengeId: challenge.challengeId,
		// we convert each 16 bits to a string to serialise
		clientDataJSON: stringify(credential.response.clientDataJSON),
		attestationObject: hexify(credential.response.attestationObject),
	});
}

async function updatePasswordLessLogin() {
	await os.api('i/2fa/password-less', {
		value: !!usePasswordLessLogin.value,
	});
	refreshAccount();
}
</script>

<style lang="scss" module>
.key {

}

.keyLastUsed {

}
</style>
