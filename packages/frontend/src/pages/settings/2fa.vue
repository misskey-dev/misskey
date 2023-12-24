<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<FormSection :first="first">
	<template #label>{{ i18n.ts['2fa'] }}</template>

	<div v-if="$i" class="_gaps_s">
		<MkInfo v-if="$i.twoFactorEnabled && $i.twoFactorBackupCodesStock === 'partial'" warn>
			{{ i18n.ts._2fa.backupCodeUsedWarning }}
		</MkInfo>
		<MkInfo v-if="$i.twoFactorEnabled && $i.twoFactorBackupCodesStock === 'none'" warn>
			{{ i18n.ts._2fa.backupCodesExhaustedWarning }}
		</MkInfo>

		<MkFolder :defaultOpen="true">
			<template #icon><i class="ti ti-shield-lock"></i></template>
			<template #label>{{ i18n.ts.totp }}</template>
			<template #caption>{{ i18n.ts.totpDescription }}</template>
			<template #suffix><i v-if="$i.twoFactorEnabled" class="ti ti-check" style="color: var(--success)"></i></template>

			<div v-if="$i.twoFactorEnabled" class="_gaps_s">
				<div v-text="i18n.ts._2fa.alreadyRegistered"/>
				<template v-if="$i.securityKeysList.length > 0">
					<MkButton @click="renewTOTP">{{ i18n.ts._2fa.renewTOTP }}</MkButton>
					<MkInfo>{{ i18n.ts._2fa.whyTOTPOnlyRenew }}</MkInfo>
				</template>
				<MkButton v-else danger @click="unregisterTOTP">{{ i18n.ts.unregister }}</MkButton>
			</div>

			<MkButton v-else-if="!$i.twoFactorEnabled" primary gradate @click="registerTOTP">{{ i18n.ts._2fa.registerTOTP }}</MkButton>
		</MkFolder>

		<MkFolder>
			<template #icon><i class="ti ti-key"></i></template>
			<template #label>{{ i18n.ts.securityKeyAndPasskey }}</template>
			<div class="_gaps_s">
				<MkInfo>
					{{ i18n.ts._2fa.securityKeyInfo }}
				</MkInfo>

				<MkInfo v-if="!webAuthnSupported()" warn>
					{{ i18n.ts._2fa.securityKeyNotSupported }}
				</MkInfo>

				<MkInfo v-else-if="webAuthnSupported() && !$i.twoFactorEnabled" warn>
					{{ i18n.ts._2fa.registerTOTPBeforeKey }}
				</MkInfo>

				<template v-else>
					<MkButton primary @click="addSecurityKey">{{ i18n.ts._2fa.registerSecurityKey }}</MkButton>
					<MkFolder v-for="key in $i.securityKeysList" :key="key.id">
						<template #label>{{ key.name }}</template>
						<template #suffix><I18n :src="i18n.ts.lastUsedAt"><template #t><MkTime :time="key.lastUsed"/></template></I18n></template>
						<div class="_buttons">
							<MkButton @click="renameKey(key)"><i class="ti ti-forms"></i> {{ i18n.ts.rename }}</MkButton>
							<MkButton danger @click="unregisterKey(key)"><i class="ti ti-trash"></i> {{ i18n.ts.unregister }}</MkButton>
						</div>
					</MkFolder>
				</template>
			</div>
		</MkFolder>

		<MkSwitch :disabled="!$i.twoFactorEnabled || $i.securityKeysList.length === 0" :modelValue="usePasswordLessLogin" @update:modelValue="v => updatePasswordLessLogin(v)">
			<template #label>{{ i18n.ts.passwordLessLogin }}</template>
			<template #caption>{{ i18n.ts.passwordLessLoginDescription }}</template>
		</MkSwitch>
	</div>
</FormSection>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, computed } from 'vue';
import { supported as webAuthnSupported, create as webAuthnCreate, parseCreationOptionsFromJSON } from '@github/webauthn-json/browser-ponyfill';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormSection from '@/components/form/section.vue';
import MkFolder from '@/components/MkFolder.vue';
import * as os from '@/os.js';
import { $i } from '@/account.js';
import { i18n } from '@/i18n.js';

// メモ: 各エンドポイントはmeUpdatedを発行するため、refreshAccountは不要

withDefaults(defineProps<{
	first?: boolean;
}>(), {
	first: false,
});

const usePasswordLessLogin = computed(() => $i?.usePasswordLessLogin ?? false);

async function registerTOTP(): Promise<void> {
	const auth = await os.authenticateDialog();
	if (auth.canceled) return;

	const twoFactorData = await os.apiWithDialog('i/2fa/register', {
		password: auth.result.password,
		token: auth.result.token,
	});

	os.popup(defineAsyncComponent(() => import('./2fa.qrdialog.vue')), {
		twoFactorData,
	}, {}, 'closed');
}

async function unregisterTOTP(): Promise<void> {
	const auth = await os.authenticateDialog();
	if (auth.canceled) return;

	os.apiWithDialog('i/2fa/unregister', {
		password: auth.result.password,
		token: auth.result.token,
	}).catch(error => {
		os.alert({
			type: 'error',
			text: error,
		});
	});
}

function renewTOTP(): void {
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

async function unregisterKey(key) {
	const confirm = await os.confirm({
		type: 'question',
		title: i18n.ts._2fa.removeKey,
		text: i18n.t('_2fa.removeKeyConfirm', { name: key.name }),
	});
	if (confirm.canceled) return;

	const auth = await os.authenticateDialog();
	if (auth.canceled) return;

	await os.apiWithDialog('i/2fa/remove-key', {
		password: auth.result.password,
		token: auth.result.token,
		credentialId: key.id,
	});
	os.success();
}

async function renameKey(key) {
	const name = await os.inputText({
		title: i18n.ts.rename,
		default: key.name,
		type: 'text',
		minLength: 1,
		maxLength: 30,
	});
	if (name.canceled) return;

	await os.apiWithDialog('i/2fa/update-key', {
		name: name.result,
		credentialId: key.id,
	});
}

async function addSecurityKey() {
	const auth = await os.authenticateDialog();
	if (auth.canceled) return;

	const registrationOptions = parseCreationOptionsFromJSON({
		publicKey: await os.apiWithDialog('i/2fa/register-key', {
			password: auth.result.password,
			token: auth.result.token,
		}),
	});

	const name = await os.inputText({
		title: i18n.ts._2fa.registerSecurityKey,
		text: i18n.ts._2fa.securityKeyName,
		type: 'text',
		minLength: 1,
		maxLength: 30,
	});
	if (name.canceled) return;

	const credential = await os.promiseDialog(
		webAuthnCreate(registrationOptions),
		null,
		() => {}, // ユーザーのキャンセルはrejectなのでエラーダイアログを出さない
		i18n.ts._2fa.tapSecurityKey,
	);
	if (!credential) return;

	const auth2 = await os.authenticateDialog();
	if (auth2.canceled) return;

	await os.apiWithDialog('i/2fa/key-done', {
		password: auth.result.password,
		token: auth.result.token,
		name: name.result,
		credential: credential.toJSON(),
	});
}

async function updatePasswordLessLogin(value: boolean) {
	await os.apiWithDialog('i/2fa/password-less', {
		value,
	});
}
</script>
