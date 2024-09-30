<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.signinRoot">
	<Transition
		mode="out-in"
		:enterActiveClass="$style.transition_enterActive"
		:leaveActiveClass="$style.transition_leaveActive"
		:enterFromClass="$style.transition_enterFrom"
		:leaveToClass="$style.transition_leaveTo"

		:inert="waiting"
	>
		<!-- 1. 外部サーバーへの転送・username入力・パスキー -->
		<XInput
			v-if="page === 'input'"
			key="input"
			:message="message"
			:openOnRemote="openOnRemote"

			@usernameSubmitted="onUsernameSubmitted"
			@passkeyClick="onPasskeyLogin"
		/>

		<!-- 2. パスワード入力 -->
		<XPassword
			v-else-if="page === 'password'"
			key="password"

			:user="userInfo!"

			@passwordSubmitted="onPasswordSubmitted"
		/>

		<!-- 3. ワンタイムパスワード -->
		<XTotp
			v-else-if="page === 'totp'"
			key="totp"

			@totpSubmitted="onTotpSubmitted"
		/>

		<!-- 4. パスキー -->
		<XPasskey
			v-else-if="page === 'passkey'"
			key="passkey"

			:user="userInfo!"
			:credentialRequest="credentialRequest!"
			:isPerformingPasswordlessLogin="doingPasskeyFromInputPage"

			@done="onPasskeyDone"
			@useTotp="onUseTotp"
		/>
	</Transition>
	<div v-if="waiting" :class="$style.waitingRoot">
		<MkLoading/>
	</div>
</div>
</template>

<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import * as Misskey from 'misskey-js';
import { supported as webAuthnSupported, parseRequestOptionsFromJSON } from '@github/webauthn-json/browser-ponyfill';

import { misskeyApi } from '@/scripts/misskey-api.js';
import { showSuspendedDialog } from '@/scripts/show-suspended-dialog.js';
import { login } from '@/account.js';
import { instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';

import XInput from '@/components/MkSignin.input.vue';
import XPassword, { type PwResponse } from '@/components/MkSignin.password.vue';
import XTotp from '@/components/MkSignin.totp.vue';
import XPasskey from '@/components/MkSignin.passkey.vue';

import type { AuthenticationPublicKeyCredential } from '@github/webauthn-json/browser-ponyfill';
import type { OpenOnRemoteOptions } from '@/scripts/please-login.js';

const captchaFailed = computed((): boolean => {
	return (
		instance.enableHcaptcha && !hCaptchaResponse.value ||
		instance.enableMcaptcha && !mCaptchaResponse.value ||
		instance.enableRecaptcha && !reCaptchaResponse.value ||
		instance.enableTurnstile && !turnstileResponse.value);
});

const emit = defineEmits<{
	(ev: 'login', v: Misskey.entities.SigninResponse): void;
}>();

const props = withDefaults(defineProps<{
	autoSet?: boolean;
	message?: string,
	openOnRemote?: OpenOnRemoteOptions,
}>(), {
	autoSet: false,
	message: '',
	openOnRemote: undefined,
});

const page = ref<'input' | 'password' | 'totp' | 'passkey'>('input');
const waiting = ref(false);

const userInfo = ref<null | Misskey.entities.UserDetailed>(null);
const password = ref('');

//#region Passkey Passwordless
const credentialRequest = shallowRef<CredentialRequestOptions | null>(null);
const passkeyContext = ref('');
const doingPasskeyFromInputPage = ref(false);

function onPasskeyLogin(): void {
	if (webAuthnSupported()) {
		doingPasskeyFromInputPage.value = true;
		waiting.value = true;
		misskeyApi('signin-with-passkey', {})
			.then((res) => {
				passkeyContext.value = res.context ?? '';
				credentialRequest.value = parseRequestOptionsFromJSON({
					publicKey: res.option,
				});

				page.value = 'passkey';
				waiting.value = false;
			})
			.catch(onLoginFailed);
	}
}

function onPasskeyDone(credential: AuthenticationPublicKeyCredential): void {
	waiting.value = true;

	if (doingPasskeyFromInputPage.value) {
		misskeyApi('signin-with-passkey', {
			credential: credential.toJSON(),
			context: passkeyContext.value,
		}).then((res) => {
			if (res.signinResponse == null) {
				onLoginFailed();
				return;
			}
			emit('login', res.signinResponse);
		}).catch(onLoginFailed);
	} else if (userInfo.value != null) {
		misskeyApi('signin', {
			username: userInfo.value.username,
			password: password.value,
			credential: credential.toJSON(),
		}).then(async (res) => {
			emit('login', res);
			await onLoginSucceeded(res);
		}).catch(onLoginFailed);
	}
}

function onUseTotp(): void {
	page.value = 'totp';
}
//#endregion

async function onUsernameSubmitted(username: string) {
	waiting.value = true;

	userInfo.value = await misskeyApi('users/show', {
		username,
	});

	if (userInfo.value == null) {
		await os.alert({
			type: 'error',
			title: i18n.ts.noSuchUser,
			text: i18n.ts.signinFailed,
		});
	} else if (userInfo.value.usePasswordLessLogin) {
		page.value = 'passkey';
	} else {
		page.value = 'password';
	}

	waiting.value = false;
}

async function onPasswordSubmitted(pw: PwResponse) {
	waiting.value = true;

	if (userInfo.value == null) {
		await os.alert({
			type: 'error',
			title: i18n.ts.noSuchUser,
			text: i18n.ts.signinFailed,
		});
		return;
	} else {
		if (!userInfo.value.twoFactorEnabled) {
			if (
				(instance.enableHcaptcha || instance.enableMcaptcha || instance.enableRecaptcha || instance.enableTurnstile) &&
				(pw.captcha.hCaptchaResponse == null && pw.captcha.mCaptchaResponse == null && pw.captcha.reCaptchaResponse == null && pw.captcha.turnstileResponse == null)
			) {
				// 2FAが無効で、CAPTCHAが有効で、かつCAPTCHAが未入力の場合
				onLoginFailed();
				waiting.value = false;
				return;
			} else {
				await misskeyApi('signin', {
					username: userInfo.value.username,
					password: pw.password,
					'h-captcha-response': pw.captcha.hCaptchaResponse,
					'm-captcha-response': pw.captcha.mCaptchaResponse,
					'g-recaptcha-response': pw.captcha.reCaptchaResponse,
					'turnstile-response': pw.captcha.turnstileResponse,
				}).then(async (res) => {
					emit('login', res);
					await onLoginSucceeded(res);
				}).catch(onLoginFailed);
			}
		} else if (userInfo.value.securityKeys) {
			password.value = pw.password;

			await misskeyApi('signin', {
				username: userInfo.value.username,
				password: pw.password,
			}).then((res) => {
				credentialRequest.value = parseRequestOptionsFromJSON({
					publicKey: res,
				});
				page.value = 'passkey';
				waiting.value = false;
			}).catch(onLoginFailed);
		} else {
			password.value = pw.password;
			page.value = 'totp';
			waiting.value = false;
		}
	}
}

async function onTotpSubmitted(token: string) {
	waiting.value = true;

	if (userInfo.value == null) {
		await os.alert({
			type: 'error',
			title: i18n.ts.noSuchUser,
			text: i18n.ts.signinFailed,
		});
		return;
	} else {
		await misskeyApi('signin', {
			username: userInfo.value.username,
			password: password.value,
			token,
		}).then(async (res) => {
			emit('login', res);
			await onLoginSucceeded(res);
		}).catch(onLoginFailed);
	}
}

async function onLoginSucceeded(res: Misskey.entities.SigninResponse) {
	if (props.autoSet) {
		await login(res.i);
	}
}

function onLoginFailed(err?: any): void {
	const id = err?.id ?? null;

	switch (id) {
		case '6cc579cc-885d-43d8-95c2-b8c7fc963280': {
			os.alert({
				type: 'error',
				title: i18n.ts.loginFailed,
				text: i18n.ts.noSuchUser,
			});
			break;
		}
		case '932c904e-9460-45b7-9ce6-7ed33be7eb2c': {
			os.alert({
				type: 'error',
				title: i18n.ts.loginFailed,
				text: i18n.ts.incorrectPassword,
			});
			break;
		}
		case 'e03a5f46-d309-4865-9b69-56282d94e1eb': {
			showSuspendedDialog();
			break;
		}
		case '22d05606-fbcf-421a-a2db-b32610dcfd1b': {
			os.alert({
				type: 'error',
				title: i18n.ts.loginFailed,
				text: i18n.ts.rateLimitExceeded,
			});
			break;
		}
		case 'cdf1235b-ac71-46d4-a3a6-84ccce48df6f': {
			os.alert({
				type: 'error',
				title: i18n.ts.loginFailed,
				text: i18n.ts.incorrectTotp,
			});
			break;
		}
		case '36b96a7d-b547-412d-aeed-2d611cdc8cdc': {
			os.alert({
				type: 'error',
				title: i18n.ts.loginFailed,
				text: i18n.ts.unknownWebAuthnKey,
			});
			break;
		}
		case '93b86c4b-72f9-40eb-9815-798928603d1e': {
			os.alert({
				type: 'error',
				title: i18n.ts.loginFailed,
				text: i18n.ts.passkeyVerificationFailed,
			});
			break;
		}
		case 'b18c89a7-5b5e-4cec-bb5b-0419f332d430': {
			os.alert({
				type: 'error',
				title: i18n.ts.loginFailed,
				text: i18n.ts.passkeyVerificationFailed,
			});
			break;
		}
		case '2d84773e-f7b7-4d0b-8f72-bb69b584c912': {
			os.alert({
				type: 'error',
				title: i18n.ts.loginFailed,
				text: i18n.ts.passkeyVerificationSucceededButPasswordlessLoginDisabled,
			});
			break;
		}
		default: {
			console.error(err);
			os.alert({
				type: 'error',
				title: i18n.ts.loginFailed,
				text: JSON.stringify(err),
			});
		}
	}

	doingPasskeyFromInputPage.value = false;
	waiting.value = false;
}
</script>

<style lang="scss" module>
.transition_enterActive,
.transition_leaveActive {
	transition: opacity 0.3s cubic-bezier(0,0,.35,1), transform 0.3s cubic-bezier(0,0,.35,1);
}
.transition_enterFrom {
	opacity: 0;
	transform: translateX(50px);
}
.transition_leaveTo {
	opacity: 0;
	transform: translateX(-50px);
}

.signinRoot {
	overflow-x: hidden;
	overflow-x: clip;

	position: relative;
}

.waitingRoot {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: color-mix(in srgb, var(--panel), transparent 50%);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1;
}
</style>
