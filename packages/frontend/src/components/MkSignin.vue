<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<form :class="{ signing, totpLogin }" @submit.prevent="onSubmit">
	<div class="_gaps_m">
		<div v-show="withAvatar" :class="$style.avatar" :style="{ backgroundImage: user ? `url('${ user.avatarUrl }')` : undefined, marginBottom: message ? '1.5em' : undefined }"></div>
		<MkInfo v-if="message">
			{{ message }}
		</MkInfo>
		<div v-if="!totpLogin" class="normal-signin _gaps_m">
			<MkInput v-model="username" :placeholder="i18n.ts.username" type="text" pattern="^[a-zA-Z0-9_]+$" :spellcheck="false" autocomplete="username webauthn" autofocus required data-cy-signin-username @update:modelValue="onUsernameChange">
				<template #prefix>@</template>
				<template #suffix>@{{ host }}</template>
			</MkInput>
			<MkInput v-if="!user || user && !user.usePasswordLessLogin" v-model="password" :placeholder="i18n.ts.password" type="password" autocomplete="current-password webauthn" :withPasswordToggle="true" required data-cy-signin-password>
				<template #prefix><i class="ti ti-lock"></i></template>
				<template #caption><button class="_textButton" type="button" @click="resetPassword">{{ i18n.ts.forgotPassword }}</button></template>
			</MkInput>
			<MkButton type="submit" large primary rounded :disabled="signing" style="margin: 0 auto;">{{ signing ? i18n.ts.loggingIn : i18n.ts.login }}</MkButton>
		</div>
		<div v-if="totpLogin" class="2fa-signin" :class="{ securityKeys: user && user.securityKeys }">
			<div v-if="user && user.securityKeys" class="twofa-group tap-group">
				<p>{{ i18n.ts.useSecurityKey }}</p>
				<MkButton v-if="!queryingKey" @click="queryKey">
					{{ i18n.ts.retry }}
				</MkButton>
			</div>
			<div v-if="user && user.securityKeys" class="or-hr">
				<p class="or-msg">{{ i18n.ts.or }}</p>
			</div>
			<div class="twofa-group totp-group">
				<p style="margin-bottom:0;">{{ i18n.ts['2fa'] }}</p>
				<MkInput v-if="user && user.usePasswordLessLogin" v-model="password" type="password" autocomplete="current-password" :withPasswordToggle="true" required>
					<template #label>{{ i18n.ts.password }}</template>
					<template #prefix><i class="ti ti-lock"></i></template>
				</MkInput>
				<MkInput v-model="token" type="text" pattern="^([0-9]{6}|[A-Z0-9]{32})$" autocomplete="one-time-code" :spellcheck="false" required>
					<template #label>{{ i18n.ts.token }}</template>
					<template #prefix><i class="ti ti-123"></i></template>
				</MkInput>
				<MkButton type="submit" :disabled="signing" large primary rounded style="margin: 0 auto;">{{ signing ? i18n.ts.loggingIn : i18n.ts.login }}</MkButton>
			</div>
		</div>
	</div>
</form>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';
import { toUnicode } from 'punycode/';
import * as Misskey from 'misskey-js';
import { supported as webAuthnSupported, get as webAuthnRequest, parseRequestOptionsFromJSON } from '@github/webauthn-json/browser-ponyfill';
import { showSuspendedDialog } from '@/scripts/show-suspended-dialog.js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkInfo from '@/components/MkInfo.vue';
import { host as configHost } from '@/config.js';
import * as os from '@/os.js';
import { login } from '@/account.js';
import { i18n } from '@/i18n.js';

let signing = $ref(false);
let user = $ref<Misskey.entities.UserDetailed | null>(null);
let username = $ref('');
let password = $ref('');
let token = $ref('');
let host = $ref(toUnicode(configHost));
let totpLogin = $ref(false);
let queryingKey = $ref(false);
let credentialRequest = $ref<CredentialRequestOptions | null>(null);
let hCaptchaResponse = $ref(null);
let reCaptchaResponse = $ref(null);

const emit = defineEmits<{
	(ev: 'login', v: any): void;
}>();

const props = defineProps({
	withAvatar: {
		type: Boolean,
		required: false,
		default: true,
	},
	autoSet: {
		type: Boolean,
		required: false,
		default: false,
	},
	message: {
		type: String,
		required: false,
		default: '',
	},
});

function onUsernameChange(): void {
	os.api('users/show', {
		username: username,
	}).then(userResponse => {
		user = userResponse;
	}, () => {
		user = null;
	});
}

function onLogin(res: any): Promise<void> | void {
	if (props.autoSet) {
		return login(res.i);
	}
}

async function queryKey(): Promise<void> {
	queryingKey = true;
	await webAuthnRequest(credentialRequest)
		.catch(() => {
			queryingKey = false;
			return Promise.reject(null);
		}).then(credential => {
			credentialRequest = null;
			queryingKey = false;
			signing = true;
			return os.api('signin', {
				username,
				password,
				credential: credential.toJSON(),
				'hcaptcha-response': hCaptchaResponse,
				'g-recaptcha-response': reCaptchaResponse,
			});
		}).then(res => {
			emit('login', res);
			return onLogin(res);
		}).catch(err => {
			if (err === null) return;
			os.alert({
				type: 'error',
				text: i18n.ts.signinFailed,
			});
			signing = false;
		});
}

function onSubmit(): void {
	signing = true;
	if (!totpLogin && user && user.twoFactorEnabled) {
		if (webAuthnSupported() && user.securityKeys) {
			os.api('signin', {
				username,
				password,
				'hcaptcha-response': hCaptchaResponse,
				'g-recaptcha-response': reCaptchaResponse,
			}).then(res => {
				totpLogin = true;
				signing = false;
				credentialRequest = parseRequestOptionsFromJSON({
					publicKey: res,
				});
			})
				.then(() => queryKey())
				.catch(loginFailed);
		} else {
			totpLogin = true;
			signing = false;
		}
	} else {
		os.api('signin', {
			username,
			password,
			'hcaptcha-response': hCaptchaResponse,
			'g-recaptcha-response': reCaptchaResponse,
			token: user?.twoFactorEnabled ? token : undefined,
		}).then(res => {
			emit('login', res);
			onLogin(res);
		}).catch(loginFailed);
	}
}

function loginFailed(err: any): void {
	switch (err.id) {
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
		default: {
			console.error(err);
			os.alert({
				type: 'error',
				title: i18n.ts.loginFailed,
				text: JSON.stringify(err),
			});
		}
	}

	totpLogin = false;
	signing = false;
}

function resetPassword(): void {
	os.popup(defineAsyncComponent(() => import('@/components/MkForgotPassword.vue')), {}, {
	}, 'closed');
}
</script>

<style lang="scss" module>
.avatar {
	margin: 0 auto 0 auto;
	width: 64px;
	height: 64px;
	background: #ddd;
	background-position: center;
	background-size: cover;
	border-radius: 100%;
}
</style>
