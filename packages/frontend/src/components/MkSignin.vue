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
			ref="inputPageEl"
			:message="message"
			:openOnRemote="openOnRemote"
			:initialUsername="initialUsername"
			:showPasskeyButton="showPasskeyButton"

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

			:credentialRequest="credentialRequest!"
			:totpAvailable="totpAvailable"

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
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import { WebAuthnAbortService, browserSupportsWebAuthn, browserSupportsWebAuthnAutofill, startAuthentication } from '@simplewebauthn/browser';
import type { PublicKeyCredentialRequestOptionsJSON, AuthenticationResponseJSON } from '@simplewebauthn/browser';
import { authUrl } from '@@/js/config.js';
import type { OpenOnRemoteOptions } from '@/utility/please-login.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { showSuspendedDialog } from '@/utility/show-suspended-dialog.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';

import XInput from '@/components/MkSignin.input.vue';
import XPassword from '@/components/MkSignin.password.vue';
import XTotp from '@/components/MkSignin.totp.vue';
import XPasskey from '@/components/MkSignin.passkey.vue';
import { login } from '@/accounts.js';

//#region backend (server/auth/SigninApiService.ts) が返すエラー ID
const ERR_NO_SUCH_USER = '6cc579cc-885d-43d8-95c2-b8c7fc963280';
const ERR_INCORRECT_PASSWORD = '932c904e-9460-45b7-9ce6-7ed33be7eb2c';
const ERR_SUSPENDED = 'e03a5f46-d309-4865-9b69-56282d94e1eb';
const ERR_RATE_LIMIT = '22d05606-fbcf-421a-a2db-b32610dcfd1b';
const ERR_INCORRECT_TOTP = 'cdf1235b-ac71-46d4-a3a6-84ccce48df6f';
const ERR_UNKNOWN_WEBAUTHN_KEY = '36b96a7d-b547-412d-aeed-2d611cdc8cdc';
const ERR_PASSKEY_VERIFICATION_FAILED = '93b86c4b-72f9-40eb-9815-798928603d1e';
const ERR_ANONYMOUS_PASSKEY_VERIFICATION_FAILED = 'b18c89a7-5b5e-4cec-bb5b-0419f332d430';
const ERR_PASSWORDLESS_DISABLED = '2d84773e-f7b7-4d0b-8f72-bb69b584c912';
const ERR_INVALID_SIGNIN_SESSION = '8e385d0a-bee2-43f3-a8cf-3fdd54da7446';
//#endregion

/** セッション失効の手前でどれだけ余裕を持って再 init するか */
const SESSION_RENEWAL_MARGIN_MS = 30 * 1000;

type SigninPage = 'input' | 'password' | 'totp' | 'passkey';

/** `Omit` はユニオンに分配されない (共通のキーしか残らない) ので分配版を使う */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** `sessionId` は MkSignin が握るので、子コンポーネントはステップの中身だけを渡す */
type SigninStep = DistributiveOmit<Misskey.entities.SigninContinueRequest, 'sessionId'>;

type AuthApiFailure = {
	/** ネットワーク到達自体に失敗した場合は `null` */
	status: number | null;
	body: unknown;
};

type AuthApiResult<T> = { ok: true; body: T } | { ok: false; failure: AuthApiFailure };

const emit = defineEmits<{
	(ev: 'login', v: Misskey.entities.SigninContinueResponse & { finished: true }): void;
}>();

const props = withDefaults(defineProps<{
	autoSet?: boolean;
	message?: string,
	openOnRemote?: OpenOnRemoteOptions,
	initialUsername?: string;
}>(), {
	autoSet: false,
	message: '',
	openOnRemote: undefined,
	initialUsername: undefined,
});

const page = ref<SigninPage>('input');
const waiting = ref(false);

const inputPageEl = useTemplateRef('inputPageEl');

/** サインインフローのセッション ID。進行状態はサーバーが持つ */
const signinFlowId = ref<string | null>(null);
/** init が返す匿名 challenge (パスワードレスログイン用) */
const anonymousPasskeyOptions = shallowRef<PublicKeyCredentialRequestOptionsJSON | null>(null);

/** パスワード画面に出す表示名・アイコン。認証には一切使わない */
const userInfo = ref<null | Misskey.entities.UserDetailed>(null);

const credentialRequest = shallowRef<PublicKeyCredentialRequestOptionsJSON | null>(null);
const totpAvailable = ref(false);

/** Conditional Mediation が使えない環境で「パスキーでログイン」ボタンを出すか */
const showPasskeyButton = ref(false);
let passkeyAutofillAvailable = false;

let initPromise: Promise<AuthApiFailure | null> | null = null;
let renewalTimer: number | null = null;

//#region /auth との通信
/** `/auth` は `/api` の機構に乗らないので生の fetch で呼ぶ。エラーの形も `{ error: { id } }` になる */
async function authApi<Req, Res>(path: string, body: Req): Promise<AuthApiResult<Res>> {
	let res: Response;
	try {
		res = await window.fetch(`${authUrl}${path}`, {
			credentials: 'omit',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		});
	} catch (err) {
		return { ok: false, failure: { status: null, body: err } };
	}

	const json = await res.json().catch(() => null);

	if (!res.ok || json == null) {
		return { ok: false, failure: { status: res.status, body: json } };
	}

	return { ok: true, body: json as Res };
}

/**
 * エラー ID を取り出す。captcha 失敗だけは fastify 既定の `{ statusCode, error, message }` が
 * 返るので、`error.id` を持たないボディも必ず許容すること。
 */
function extractErrorId(body: unknown): string | null {
	if (typeof body !== 'object' || body == null) return null;
	const error = (body as { error?: unknown }).error;
	if (typeof error !== 'object' || error == null) return null;
	const id = (error as { id?: unknown }).id;
	return typeof id === 'string' ? id : null;
}

/**
 * サーバーが同じセッションのままやり直しを許す失敗か (backend の `StepFailure.hard === false`)。
 * これ以外ではサーバー側のセッションが破棄されており、再 init しないと次が必ず 401 になる。
 */
function isRetryableFailure(status: number, id: string | null): boolean {
	switch (id) {
		case ERR_INCORRECT_PASSWORD:
		case ERR_INCORRECT_TOTP:
		case ERR_RATE_LIMIT: // レートリミットはセッションに触れる前に返る
			return true;
		// username ステップ (404) ならユーザー名を入れ直せるが、
		// 匿名パスキー経路 (403) でユーザーが見つからない場合は challenge を使い切っている
		case ERR_NO_SUCH_USER:
			return status === 404;
		default:
			return false;
	}
}
//#endregion

//#region セッション
function clearRenewalTimer(): void {
	if (renewalTimer != null) {
		window.clearTimeout(renewalTimer);
		renewalTimer = null;
	}
}

/**
 * セッションが切れる手前で作り直す。進行中のセッションを置き換えると状態が失われるので、
 * `'input'` にいる間だけ予約する。
 */
function scheduleSessionRenewal(expiresAt: number): void {
	clearRenewalTimer();
	if (page.value !== 'input') return;

	const delay = Math.max(0, expiresAt - Date.now() - SESSION_RENEWAL_MARGIN_MS);
	renewalTimer = window.setTimeout(() => {
		renewalTimer = null;
		if (page.value !== 'input') return;
		initSession();
	}, delay);
}

async function doInitSession(): Promise<AuthApiFailure | null> {
	// 古いセッションの challenge を握ったままの Conditional Mediation は必ず畳む
	WebAuthnAbortService.cancelCeremony();

	clearRenewalTimer();
	signinFlowId.value = null;
	anonymousPasskeyOptions.value = null;

	const res = await authApi<Misskey.entities.SigninInitRequest, Misskey.entities.SigninInitResponse>('/signin/init', {});
	if (!res.ok) return res.failure;

	signinFlowId.value = res.body.sessionId;
	anonymousPasskeyOptions.value = res.body.passkeyOptions;
	scheduleSessionRenewal(res.body.expiresAt);
	startConditionalMediation(res.body.sessionId, res.body.passkeyOptions);

	return null;
}

/**
 * Conditional Mediation を開始する。オートフィルからパスキーを選ぶとログインが完了する。
 *
 * `startAuthentication` はオートフィルが選ばれるまで解決しないので await してはいけない。
 * 中断は `WebAuthnAbortService.cancelCeremony()` で行う (`signal` は受け取らない)。
 * `verifyBrowserAutofillInput` は `autocomplete` の末尾が `webauthn` の `<input>` が DOM に
 * 無いと throw するので、MkSignin.input.vue のユーザー名欄が描画されてから開始する。
 */
function startConditionalMediation(sessionId: string, options: PublicKeyCredentialRequestOptionsJSON): void {
	if (!passkeyAutofillAvailable) return;

	nextTick(() => {
		if (signinFlowId.value !== sessionId || page.value !== 'input') return;

		startAuthentication({
			optionsJSON: options,
			useBrowserAutofill: true,
		}).then((credential) => {
			// 匿名 challenge はユーザー未確定の間しか使えない。オートフィルが遅れて解決した場合に
			// 備え、開始時のセッションのままかを必ず確認する
			if (signinFlowId.value !== sessionId || page.value !== 'input') return;

			return continueSignin({ passkeyCredential: credential });
		}).catch(() => {
			// ユーザーによるキャンセル、または cancelCeremony による中断。どちらも何もしない
		});
	});
}

/** セッションを発行する。同時に走った呼び出しは 1 本にまとめる */
function initSession(): Promise<AuthApiFailure | null> {
	initPromise ??= doInitSession().finally(() => {
		initPromise = null;
	});
	return initPromise;
}

/** 送信直前にセッションを確保する。確保できなければエラーを出して `null` を返す */
async function ensureSession(): Promise<string | null> {
	if (signinFlowId.value != null) return signinFlowId.value;

	const failure = await initSession();
	if (failure != null) {
		os.alert({
			type: 'error',
			title: i18n.ts.loginFailed,
			text: extractErrorId(failure.body) === ERR_RATE_LIMIT ? i18n.ts.rateLimitExceeded : i18n.ts.somethingHappened,
		});
		return null;
	}

	return signinFlowId.value;
}

/** 入力画面に戻してセッションを取り直す */
async function restartSession(): Promise<void> {
	userInfo.value = null;
	credentialRequest.value = null;
	totpAvailable.value = false;
	setPage('input');
	await initSession();
}

/** ページ遷移。入力画面を離れるときはセッションの作り直しと Conditional Mediation を止める */
function setPage(next: SigninPage): void {
	if (page.value === 'input' && next !== 'input') {
		clearRenewalTimer();
		WebAuthnAbortService.cancelCeremony();
	}
	page.value = next;
}
//#endregion

//#region 各ステップ
async function onUsernameSubmitted(step: Omit<Misskey.entities.SigninContinueRequestUsername, 'sessionId'>): Promise<void> {
	// ここで畳まないと、後からオートフィルが解決した credential が「ユーザー確定済み」の
	// セッションへ送られ、匿名 challenge が見つからずセッションごとハード失敗する
	WebAuthnAbortService.cancelCeremony();

	// users/show を待つ間も塞ぐ。username ステップの二重送信はサーバーがセッションごと破棄する
	waiting.value = true;

	// 表示名とアイコンをパスワード画面に出すためだけに引く (認証には使わない)
	userInfo.value = await misskeyApi('users/show', {
		username: step.username,
	}).catch(() => null);

	await continueSignin(step);
}

async function onPasswordSubmitted(password: string): Promise<void> {
	await continueSignin({ password });
}

async function onTotpSubmitted(token: string): Promise<void> {
	await continueSignin({ token });
}

async function onPasskeyDone(credential: AuthenticationResponseJSON): Promise<void> {
	await continueSignin({ passkeyCredential: credential });
}

function onUseTotp(): void {
	setPage('totp');
}

/** 「パスキーでログイン」ボタン。init が発行済みの匿名 challenge をそのまま使う */
async function onPasskeyLogin(): Promise<void> {
	if (!browserSupportsWebAuthn()) return;

	waiting.value = true;

	const sessionId = await ensureSession();
	const options = anonymousPasskeyOptions.value;
	if (sessionId == null || options == null) {
		waiting.value = false;
		return;
	}

	credentialRequest.value = options;
	totpAvailable.value = false;
	setPage('passkey');

	nextTick(() => {
		waiting.value = false;
	});
}
//#endregion

async function continueSignin(step: SigninStep): Promise<void> {
	waiting.value = true;

	const sessionId = await ensureSession();
	if (sessionId == null) {
		waiting.value = false;
		return;
	}

	const res = await authApi<Misskey.entities.SigninContinueRequest, Misskey.entities.SigninContinueResponse>('/signin/continue', {
		sessionId,
		...step,
	});

	if (!res.ok) {
		await onSigninApiError(res.failure);
		return;
	}

	if (res.body.finished) {
		emit('login', res.body);
		await onLoginSucceeded(res.body);
		return;
	}

	switch (res.body.next) {
		case 'password': {
			if (userInfo.value == null) {
				// パスワード画面はユーザー情報 (表示名・アイコン) を必須にしているので進めない
				os.alert({
					type: 'error',
					title: i18n.ts.loginFailed,
					text: i18n.ts.noSuchUser,
				});
				await restartSession();
				break;
			}
			setPage('password');
			break;
		}
		case 'totp': {
			setPage('totp');
			break;
		}
		case 'passkey': {
			if (browserSupportsWebAuthn()) {
				credentialRequest.value = res.body.passkeyOptions;
				totpAvailable.value = false;
				setPage('passkey');
			} else {
				// このブラウザではパスキーを扱えず、TOTP へのフォールバックも無いので入力画面まで戻す
				os.alert({
					type: 'error',
					title: i18n.ts.loginFailed,
					text: i18n.ts._2fa.securityKeyNotSupported,
				});
				await restartSession();
			}
			break;
		}
		case 'totpOrPasskey': {
			if (browserSupportsWebAuthn()) {
				credentialRequest.value = res.body.passkeyOptions;
				totpAvailable.value = true;
				setPage('passkey');
			} else {
				setPage('totp');
			}
			break;
		}
	}

	inputPageEl.value?.resetCaptcha();
	nextTick(() => {
		waiting.value = false;
	});
}

async function onLoginSucceeded(res: Misskey.entities.SigninContinueResponse & { finished: true }): Promise<void> {
	clearRenewalTimer();
	signinFlowId.value = null;

	if (props.autoSet) {
		await login(res.i);
	}
}

async function onSigninApiError(failure: AuthApiFailure): Promise<void> {
	const id = extractErrorId(failure.body);

	if (failure.status == null) {
		// リクエストがサーバーに届いていないのでセッションの状態は変わっていない。そのまま再試行できる
		console.error(failure.body);
		os.alert({
			type: 'error',
			title: i18n.ts.loginFailed,
			text: i18n.ts.somethingHappened,
		});
		inputPageEl.value?.resetCaptcha();
		nextTick(() => {
			waiting.value = false;
		});
		return;
	}

	switch (id) {
		case ERR_NO_SUCH_USER: {
			os.alert({
				type: 'error',
				title: i18n.ts.loginFailed,
				text: i18n.ts.noSuchUser,
			});
			break;
		}
		case ERR_INCORRECT_PASSWORD: {
			os.alert({
				type: 'error',
				title: i18n.ts.loginFailed,
				text: i18n.ts.incorrectPassword,
			});
			break;
		}
		case ERR_SUSPENDED: {
			showSuspendedDialog();
			break;
		}
		case ERR_RATE_LIMIT: {
			os.alert({
				type: 'error',
				title: i18n.ts.loginFailed,
				text: i18n.ts.rateLimitExceeded,
			});
			break;
		}
		case ERR_INCORRECT_TOTP: {
			os.alert({
				type: 'error',
				title: i18n.ts.loginFailed,
				text: i18n.ts.incorrectTotp,
			});
			break;
		}
		case ERR_UNKNOWN_WEBAUTHN_KEY: {
			os.alert({
				type: 'error',
				title: i18n.ts.loginFailed,
				text: i18n.ts.unknownWebAuthnKey,
			});
			break;
		}
		case ERR_PASSKEY_VERIFICATION_FAILED:
		case ERR_ANONYMOUS_PASSKEY_VERIFICATION_FAILED: {
			os.alert({
				type: 'error',
				title: i18n.ts.loginFailed,
				text: i18n.ts.passkeyVerificationFailed,
			});
			break;
		}
		case ERR_PASSWORDLESS_DISABLED: {
			os.alert({
				type: 'error',
				title: i18n.ts.loginFailed,
				text: i18n.ts.passkeyVerificationSucceededButPasswordlessLoginDisabled,
			});
			break;
		}
		case ERR_INVALID_SIGNIN_SESSION: {
			os.alert({
				type: 'error',
				title: i18n.ts.loginFailed,
				text: i18n.ts.signinSessionExpired,
			});
			break;
		}
		default: {
			// captcha 失敗は error.id を持たないのでここに落ちる。生のボディは画面には出さない
			console.error(failure.body);
			os.alert({
				type: 'error',
				title: i18n.ts.loginFailed,
				text: i18n.ts.somethingHappened,
			});
		}
	}

	inputPageEl.value?.resetCaptcha();

	if (!isRetryableFailure(failure.status, id)) {
		await restartSession();
	}

	nextTick(() => {
		waiting.value = false;
	});
}

onMounted(async () => {
	passkeyAutofillAvailable = browserSupportsWebAuthn() && await browserSupportsWebAuthnAutofill();
	showPasskeyButton.value = browserSupportsWebAuthn() && !passkeyAutofillAvailable;

	await initSession();
});

onBeforeUnmount(() => {
	WebAuthnAbortService.cancelCeremony();
	clearRenewalTimer();
	signinFlowId.value = null;
	anonymousPasskeyOptions.value = null;
	credentialRequest.value = null;
	userInfo.value = null;
});
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
	background-color: color-mix(in srgb, var(--MI_THEME-panel), transparent 50%);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1;
}
</style>
