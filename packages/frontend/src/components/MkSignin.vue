<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<form :class="{ signing, totpLogin }" @submit.prevent="onSubmit">
	<div class="_gaps_m">
		<div v-show="withAvatar" :class="$style.avatar" :style="{ backgroundImage: user ? `url('${user.avatarUrl}')` : undefined, marginBottom: message ? '1.5em' : undefined }"></div>
		<MkInfo v-if="message">
			{{ message }}
		</MkInfo>
		<div v-if="openOnRemote" class="_gaps_m">
			<div class="_gaps_s">
				<MkButton type="button" rounded primary style="margin: 0 auto;" @click="openRemote(openOnRemote)">
					{{ i18n.ts.continueOnRemote }} <i class="ti ti-external-link"></i>
				</MkButton>
				<button type="button" class="_button" :class="$style.instanceManualSelectButton" @click="specifyHostAndOpenRemote(openOnRemote)">
					{{ i18n.ts.specifyServerHost }}
				</button>
			</div>
			<div :class="$style.orHr">
				<p :class="$style.orMsg">{{ i18n.ts.or }}</p>
			</div>
		</div>
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
			<div v-if="user && user.securityKeys" :class="$style.orHr">
				<p :class="$style.orMsg">{{ i18n.ts.or }}</p>
			</div>
			<div class="twofa-group totp-group _gaps">
				<MkInput v-if="user && user.usePasswordLessLogin" v-model="password" type="password" autocomplete="current-password" :withPasswordToggle="true" required>
					<template #label>{{ i18n.ts.password }}</template>
					<template #prefix><i class="ti ti-lock"></i></template>
				</MkInput>
				<MkInput v-model="token" type="text" :pattern="isBackupCode ? '^[A-Z0-9]{32}$' :'^[0-9]{6}$'" autocomplete="one-time-code" required :spellcheck="false" :inputmode="isBackupCode ? undefined : 'numeric'">
					<template #label>{{ i18n.ts.token }} ({{ i18n.ts['2fa'] }})</template>
					<template #prefix><i v-if="isBackupCode" class="ti ti-key"></i><i v-else class="ti ti-123"></i></template>
					<template #caption><button class="_textButton" type="button" @click="isBackupCode = !isBackupCode">{{ isBackupCode ? i18n.ts.useTotp : i18n.ts.useBackupCode }}</button></template>
				</MkInput>
				<MkButton type="submit" :disabled="signing" large primary rounded style="margin: 0 auto;">{{ signing ? i18n.ts.loggingIn : i18n.ts.login }}</MkButton>
			</div>
		</div>
	</div>
</form>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue';
import { toUnicode } from 'punycode/';
import * as Misskey from 'misskey-js';
import { supported as webAuthnSupported, get as webAuthnRequest, parseRequestOptionsFromJSON } from '@github/webauthn-json/browser-ponyfill';
import type { OpenOnRemoteOptions } from '@/scripts/please-login.js';
import { showSuspendedDialog } from '@/scripts/show-suspended-dialog.js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkInfo from '@/components/MkInfo.vue';
import { host as configHost } from '@/config.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { query, extractDomain } from '@/scripts/url.js';
import { login } from '@/account.js';
import { i18n } from '@/i18n.js';

const signing = ref(false);
const user = ref<Misskey.entities.UserDetailed | null>(null);
const username = ref('');
const password = ref('');
const token = ref('');
const host = ref(toUnicode(configHost));
const totpLogin = ref(false);
const isBackupCode = ref(false);
const queryingKey = ref(false);
let credentialRequest: CredentialRequestOptions | null = null;

const emit = defineEmits<{
	(ev: 'login', v: any): void;
}>();

const props = withDefaults(defineProps<{
	withAvatar?: boolean;
	autoSet?: boolean;
	message?: string,
	openOnRemote?: OpenOnRemoteOptions,
}>(), {
	withAvatar: true,
	autoSet: false,
	message: '',
	openOnRemote: undefined,
});

function onUsernameChange(): void {
	misskeyApi('users/show', {
		username: username.value,
	}).then(userResponse => {
		user.value = userResponse;
	}, () => {
		user.value = null;
	});
}

function onLogin(res: any): Promise<void> | void {
	if (props.autoSet) {
		return login(res.i);
	}
}

async function queryKey(): Promise<void> {
	if (credentialRequest == null) return;
	queryingKey.value = true;
	await webAuthnRequest(credentialRequest)
		.catch(() => {
			queryingKey.value = false;
			return Promise.reject(null);
		}).then(credential => {
			credentialRequest = null;
			queryingKey.value = false;
			signing.value = true;
			return misskeyApi('signin', {
				username: username.value,
				password: password.value,
				credential: credential.toJSON(),
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
			signing.value = false;
		});
}

function onSubmit(): void {
	signing.value = true;
	if (!totpLogin.value && user.value && user.value.twoFactorEnabled) {
		if (webAuthnSupported() && user.value.securityKeys) {
			misskeyApi('signin', {
				username: username.value,
				password: password.value,
			}).then(res => {
				totpLogin.value = true;
				signing.value = false;
				credentialRequest = parseRequestOptionsFromJSON({
					publicKey: res,
				});
			})
				.then(() => queryKey())
				.catch(loginFailed);
		} else {
			totpLogin.value = true;
			signing.value = false;
		}
	} else {
		misskeyApi('signin', {
			username: username.value,
			password: password.value,
			token: user.value?.twoFactorEnabled ? token.value : undefined,
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

	totpLogin.value = false;
	signing.value = false;
}

function resetPassword(): void {
	const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkForgotPassword.vue')), {}, {
		closed: () => dispose(),
	});
}

function openRemote(options: OpenOnRemoteOptions, targetHost?: string): void {
	switch (options.type) {
		case 'web':
		case 'lookup': {
			let _path: string;

			if (options.type === 'lookup') {
				// TODO: v2024.7.0以降が浸透してきたら正式なURLに変更する▼
				// _path = `/lookup?uri=${encodeURIComponent(_path)}`;
				_path = `/authorize-follow?acct=${encodeURIComponent(options.url)}`;
			} else {
				_path = options.path;
			}

			if (targetHost) {
				window.open(`https://${targetHost}${_path}`, '_blank', 'noopener');
			} else {
				window.open(`https://misskey-hub.net/mi-web/?path=${encodeURIComponent(_path)}`, '_blank', 'noopener');
			}
			break;
		}
		case 'share': {
			const params = query(options.params);
			if (targetHost) {
				window.open(`https://${targetHost}/share?${params}`, '_blank', 'noopener');
			} else {
				window.open(`https://misskey-hub.net/share/?${params}`, '_blank', 'noopener');
			}
			break;
		}
	}
}

async function specifyHostAndOpenRemote(options: OpenOnRemoteOptions): Promise<void> {
	const { canceled, result: hostTemp } = await os.inputText({
		title: i18n.ts.inputHostName,
		placeholder: 'misskey.example.com',
	});

	if (canceled) return;

	let targetHost: string | null = hostTemp;

	// ドメイン部分だけを取り出す
	targetHost = extractDomain(targetHost);
	if (targetHost == null) {
		os.alert({
			type: 'error',
			title: i18n.ts.invalidValue,
			text: i18n.ts.tryAgain,
		});
		return;
	}
	openRemote(options, targetHost);
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

.instanceManualSelectButton {
	display: block;
	text-align: center;
	opacity: .7;
	font-size: .8em;

	&:hover {
		text-decoration: underline;
	}
}

.orHr {
	position: relative;
	margin: .4em auto;
	width: 100%;
	height: 1px;
	background: var(--divider);
}

.orMsg {
	position: absolute;
	top: -.6em;
	display: inline-block;
	padding: 0 1em;
	background: var(--panel);
	font-size: 0.8em;
	color: var(--fgOnPanel);
	margin: 0;
	left: 50%;
	transform: translateX(-50%);
}
</style>
