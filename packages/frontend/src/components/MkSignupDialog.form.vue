<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div :class="$style.banner">
		<i class="ti ti-user-edit"></i>
	</div>
	<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 32px;">
		<form class="_gaps_m" autocomplete="new-password" @submit.prevent="onSubmit">
			<MkInput v-if="instance.disableRegistration" v-model="invitationCode" type="text" :spellcheck="false" required data-cy-signup-invitation-code>
				<template #label>{{ i18n.ts.invitationCode }}</template>
				<template #prefix><i class="ti ti-key"></i></template>
			</MkInput>
			<MkInput v-model="username" type="text" pattern="^[a-zA-Z0-9_]{1,20}$" :spellcheck="false" autocomplete="username" required data-cy-signup-username @update:modelValue="onChangeUsername">
				<template #label>{{ i18n.ts.username }} <div v-tooltip:dialog="i18n.ts.usernameInfo" class="_button _help"><i class="ti ti-help-circle"></i></div></template>
				<template #prefix>@</template>
				<template #suffix>@{{ host }}</template>
				<template #caption>
					<div><i class="ti ti-alert-triangle ti-fw"></i> {{ i18n.ts.cannotBeChangedLater }}</div>
					<span v-if="usernameState === 'wait'" style="color:#999"><MkLoading :em="true"/> {{ i18n.ts.checking }}</span>
					<span v-else-if="usernameState === 'ok'" style="color: var(--MI_THEME-success)"><i class="ti ti-check ti-fw"></i> {{ i18n.ts.available }}</span>
					<span v-else-if="usernameState === 'unavailable'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ i18n.ts.unavailable }}</span>
					<span v-else-if="usernameState === 'error'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ i18n.ts.error }}</span>
					<span v-else-if="usernameState === 'invalid-format'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ i18n.ts.usernameInvalidFormat }}</span>
					<span v-else-if="usernameState === 'min-range'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ i18n.ts.tooShort }}</span>
					<span v-else-if="usernameState === 'max-range'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ i18n.ts.tooLong }}</span>
				</template>
			</MkInput>
			<MkInput v-if="instance.emailRequiredForSignup" v-model="email" :debounce="true" type="email" :spellcheck="false" required data-cy-signup-email @update:modelValue="onChangeEmail">
				<template #label>{{ i18n.ts.emailAddress }} <div v-tooltip:dialog="i18n.ts._signup.emailAddressInfo" class="_button _help"><i class="ti ti-help-circle"></i></div></template>
				<template #prefix><i class="ti ti-mail"></i></template>
				<template #caption>
					<span v-if="emailState === 'wait'" style="color:#999"><MkLoading :em="true"/> {{ i18n.ts.checking }}</span>
					<span v-else-if="emailState === 'ok'" style="color: var(--MI_THEME-success)"><i class="ti ti-check ti-fw"></i> {{ i18n.ts.available }}</span>
					<span v-else-if="emailState === 'unavailable:used'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ i18n.ts._emailUnavailable.used }}</span>
					<span v-else-if="emailState === 'unavailable:format'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ i18n.ts._emailUnavailable.format }}</span>
					<span v-else-if="emailState === 'unavailable:disposable'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ i18n.ts._emailUnavailable.disposable }}</span>
					<span v-else-if="emailState === 'unavailable:banned'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ i18n.ts._emailUnavailable.banned }}</span>
					<span v-else-if="emailState === 'unavailable:mx'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ i18n.ts._emailUnavailable.mx }}</span>
					<span v-else-if="emailState === 'unavailable:smtp'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ i18n.ts._emailUnavailable.smtp }}</span>
					<span v-else-if="emailState === 'unavailable'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ i18n.ts.unavailable }}</span>
					<span v-else-if="emailState === 'error'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ i18n.ts.error }}</span>
				</template>
			</MkInput>
			<MkInput v-model="password" type="password" autocomplete="new-password" required data-cy-signup-password @update:modelValue="onChangePassword">
				<template #label>{{ i18n.ts.password }}</template>
				<template #prefix><i class="ti ti-lock"></i></template>
				<template #caption>
					<span v-if="passwordStrength == 'low'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ i18n.ts.weakPassword }}</span>
					<span v-if="passwordStrength == 'medium'" style="color: var(--MI_THEME-warn)"><i class="ti ti-check ti-fw"></i> {{ i18n.ts.normalPassword }}</span>
					<span v-if="passwordStrength == 'high'" style="color: var(--MI_THEME-success)"><i class="ti ti-check ti-fw"></i> {{ i18n.ts.strongPassword }}</span>
				</template>
			</MkInput>
			<MkInput v-model="retypedPassword" type="password" autocomplete="new-password" required data-cy-signup-password-retype @update:modelValue="onChangePasswordRetype">
				<template #label>{{ i18n.ts.password }} ({{ i18n.ts.retype }})</template>
				<template #prefix><i class="ti ti-lock"></i></template>
				<template #caption>
					<span v-if="passwordRetypeState == 'match'" style="color: var(--MI_THEME-success)"><i class="ti ti-check ti-fw"></i> {{ i18n.ts.passwordMatched }}</span>
					<span v-if="passwordRetypeState == 'not-match'" style="color: var(--MI_THEME-error)"><i class="ti ti-alert-triangle ti-fw"></i> {{ i18n.ts.passwordNotMatched }}</span>
				</template>
			</MkInput>
			<MkCaptcha v-if="instance.enableHcaptcha" ref="hcaptcha" v-model="hCaptchaResponse" :class="$style.captcha" provider="hcaptcha" :sitekey="instance.hcaptchaSiteKey"/>
			<MkCaptcha v-if="instance.enableMcaptcha" ref="mcaptcha" v-model="mCaptchaResponse" :class="$style.captcha" provider="mcaptcha" :sitekey="instance.mcaptchaSiteKey" :instanceUrl="instance.mcaptchaInstanceUrl"/>
			<MkCaptcha v-if="instance.enableRecaptcha" ref="recaptcha" v-model="reCaptchaResponse" :class="$style.captcha" provider="recaptcha" :sitekey="instance.recaptchaSiteKey"/>
			<MkCaptcha v-if="instance.enableTurnstile" ref="turnstile" v-model="turnstileResponse" :class="$style.captcha" provider="turnstile" :sitekey="instance.turnstileSiteKey"/>
			<MkCaptcha v-if="instance.enableTestcaptcha" ref="testcaptcha" v-model="testcaptchaResponse" :class="$style.captcha" provider="testcaptcha" :sitekey="null"/>

			<!-- Server Rules Agreement -->
			<div v-if="availableServerRules" class="_gaps_s" :class="$style.agreementSection">
				<div class="_gaps_xs">
					<div style="font-weight: bold; text-align: center;">{{ i18n.ts.serverRules }}</div>
					<div :class="$style.rulesList">
						<div v-for="(item, index) in instance.serverRules.slice(0, 3)" :key="index" :class="$style.ruleItem">
							{{ index + 1 }}. <span v-html="item"></span>
						</div>
						<div v-if="instance.serverRules.length > 3" :class="$style.moreRules">
							... and {{ instance.serverRules.length - 3 }} more rules
						</div>
					</div>
					<MkSwitch v-model="agreeServerRules" :disabled="submitting">
						{{ i18n.ts.agree }}
					</MkSwitch>
				</div>
			</div>

			<!-- Server Rules Agreement -->
			<div v-if="availableServerRules" class="_gaps_s" :class="$style.agreementSection">
				<div class="_gaps_xs">
					<div style="font-weight: bold; text-align: center;">{{ i18n.ts.serverRules }}</div>
					<div style="font-size: 0.85em; color: var(--MI_THEME-warn); margin-bottom: 8px;">
						{{ i18n.ts.beSureToReadThisAsItIsImportant }}
					</div>
					<div :class="$style.rulesPreview">
						<div v-for="(item, index) in instance.serverRules.slice(0, 3)" :key="index" style="margin-bottom: 4px; font-size: 0.9em;">
							{{ index + 1 }}. <span v-html="item"></span>
						</div>
						<div v-if="instance.serverRules.length > 3" style="font-style: italic; color: var(--MI_THEME-fg); margin-top: 4px; font-size: 0.85em;">
							... and {{ instance.serverRules.length - 3 }} more rules
						</div>
					</div>
					<MkSwitch v-model="agreeServerRules" :disabled="submitting" @update:modelValue="updateAgreeServerRules">
						{{ i18n.ts.agree }}
					</MkSwitch>
				</div>
			</div>

			<!-- Terms of Service Agreement -->
			<div v-if="availableTos || availablePrivacyPolicy" class="_gaps_s" :class="$style.agreementSection">
				<div class="_gaps_xs">
					<div style="font-weight: bold; text-align: center;">{{ tosPrivacyPolicyLabel }}</div>
					<div class="_gaps_xs">
						<a v-if="availableTos" :href="instance.tosUrl ?? undefined" target="_blank" rel="noopener" class="_link">
							<i class="ti ti-external-link"></i>
							{{ i18n.ts.termsOfService }}
						</a>
						<a v-if="availablePrivacyPolicy" :href="instance.privacyPolicyUrl ?? undefined" target="_blank" rel="noopener" class="_link">
							<i class="ti ti-external-link"></i>
							{{ i18n.ts.privacyPolicy }}
						</a>
					</div>
					<MkSwitch v-model="agreeTosAndPrivacyPolicy" :disabled="submitting" @update:modelValue="updateAgreeTosAndPrivacyPolicy">
						{{ i18n.ts.agree }}
					</MkSwitch>
				</div>
			</div>

			<!-- Basic Notes Agreement -->
			<div class="_gaps_s" :class="$style.agreementSection">
				<div class="_gaps_xs">
					<div style="font-weight: bold; text-align: center;">{{ i18n.ts.basicNotesBeforeCreateAccount }}</div>
					<a href="https://misskey-hub.net/docs/for-users/onboarding/warning/" target="_blank" rel="noopener" class="_link">
						<i class="ti ti-external-link"></i>
						{{ i18n.ts.basicNotesBeforeCreateAccount }}
					</a>
					<MkSwitch v-model="agreeNote" :disabled="submitting" @update:modelValue="updateAgreeNote">
						{{ i18n.ts.agree }}
					</MkSwitch>
				</div>
			</div>

			<div class="_buttonsCenter">
				<MkButton type="submit" :disabled="shouldDisableSubmitting" large gradate rounded primary data-cy-signup-submit>
					<template v-if="submitting">
						<MkLoading :em="true" :colored="false"/>
					</template>
					<template v-else>{{ i18n.ts.start }}</template>
				</MkButton>
			</div>
		</form>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { toUnicode } from 'punycode.js';
import * as Misskey from 'misskey-js';
import * as config from '@@/js/config.js';
import MkButton from './MkButton.vue';
import MkInput from './MkInput.vue';
import MkSwitch from './MkSwitch.vue';
import type { Captcha } from '@/components/MkCaptcha.vue';
import MkCaptcha from '@/components/MkCaptcha.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { login } from '@/accounts.js';

const props = withDefaults(defineProps<{
	autoSet?: boolean;
}>(), {
	autoSet: false,
});

const emit = defineEmits<{
	(ev: 'signup', user: Misskey.entities.SignupResponse): void;
	(ev: 'signupEmailPending'): void;
}>();

const host = toUnicode(config.host);

const hcaptcha = ref<Captcha | undefined>();
const mcaptcha = ref<Captcha | undefined>();
const recaptcha = ref<Captcha | undefined>();
const turnstile = ref<Captcha | undefined>();
const testcaptcha = ref<Captcha | undefined>();

const username = ref<string>('');
const password = ref<string>('');
const retypedPassword = ref<string>('');
const invitationCode = ref<string>('');
const email = ref('');
const usernameState = ref<null | 'wait' | 'ok' | 'unavailable' | 'error' | 'invalid-format' | 'min-range' | 'max-range'>(null);
const emailState = ref<null | 'wait' | 'ok' | 'unavailable:used' | 'unavailable:format' | 'unavailable:disposable' | 'unavailable:banned' | 'unavailable:mx' | 'unavailable:smtp' | 'unavailable' | 'error'>(null);
const passwordStrength = ref<'' | 'low' | 'medium' | 'high'>('');
const passwordRetypeState = ref<null | 'match' | 'not-match'>(null);
const submitting = ref<boolean>(false);
const hCaptchaResponse = ref<string | null>(null);
const mCaptchaResponse = ref<string | null>(null);
const reCaptchaResponse = ref<string | null>(null);
const turnstileResponse = ref<string | null>(null);
const testcaptchaResponse = ref<string | null>(null);
const usernameAbortController = ref<null | AbortController>(null);
const emailAbortController = ref<null | AbortController>(null);
// Agreement states
const agreeServerRules = ref<boolean>(false);
const agreeTosAndPrivacyPolicy = ref<boolean>(false);
const agreeNote = ref<boolean>(false);

// Availability flags
const availableServerRules = instance.serverRules.length > 0;
const availableTos = instance.tosUrl != null && instance.tosUrl !== '';
const availablePrivacyPolicy = instance.privacyPolicyUrl != null && instance.privacyPolicyUrl !== '';

// Legacy support
const isAcceptedServerRule = computed(() => {
	return (!availableServerRules || agreeServerRules.value) &&
	       ((!availableTos && !availablePrivacyPolicy) || agreeTosAndPrivacyPolicy.value) &&
	       agreeNote.value;
});

const shouldDisableSubmitting = computed((): boolean => {
	return submitting.value ||
		instance.enableHcaptcha && !hCaptchaResponse.value ||
		instance.enableMcaptcha && !mCaptchaResponse.value ||
		instance.enableRecaptcha && !reCaptchaResponse.value ||
		instance.enableTurnstile && !turnstileResponse.value ||
		instance.enableTestcaptcha && !testcaptchaResponse.value ||
		instance.emailRequiredForSignup && emailState.value !== 'ok' ||
		instance.disableRegistration && invitationCode.value === '' ||
		!isAcceptedServerRule.value ||
		usernameState.value !== 'ok' ||
		passwordRetypeState.value !== 'match';
});

function getPasswordStrength(source: string): number {
	let strength = 0;
	let power = 0.018;

	// 英数字
	if (/[a-zA-Z]/.test(source) && /[0-9]/.test(source)) {
		power += 0.020;
	}

	// 大文字と小文字が混ざってたら
	if (/[a-z]/.test(source) && /[A-Z]/.test(source)) {
		power += 0.015;
	}

	// 記号が混ざってたら
	if (/[!\x22\#$%&@'()*+,-./_]/.test(source)) {
		power += 0.02;
	}

	strength = power * source.length;

	return Math.max(0, Math.min(1, strength));
}

function onChangeUsername(): void {
	if (username.value === '') {
		usernameState.value = null;
		return;
	}

	{
		const err =
			!username.value.match(/^[a-zA-Z0-9_]+$/) ? 'invalid-format' :
			username.value.length < 1 ? 'min-range' :
			username.value.length > 20 ? 'max-range' :
			null;

		if (err) {
			usernameState.value = err;
			return;
		}
	}

	if (usernameAbortController.value != null) {
		usernameAbortController.value.abort();
	}
	usernameState.value = 'wait';
	usernameAbortController.value = new AbortController();

	misskeyApi('username/available', {
		username: username.value,
	}, undefined, usernameAbortController.value.signal).then(result => {
		usernameState.value = result.available ? 'ok' : 'unavailable';
	}).catch((err) => {
		if (err.name !== 'AbortError') {
			usernameState.value = 'error';
		}
	});
}

function onChangeEmail(): void {
	if (email.value === '') {
		emailState.value = null;
		return;
	}

	if (emailAbortController.value != null) {
		emailAbortController.value.abort();
	}
	emailState.value = 'wait';
	emailAbortController.value = new AbortController();

	misskeyApi('email-address/available', {
		emailAddress: email.value,
	}, undefined, emailAbortController.value.signal).then(result => {
		emailState.value = result.available ? 'ok' :
			result.reason === 'used' ? 'unavailable:used' :
			result.reason === 'format' ? 'unavailable:format' :
			result.reason === 'disposable' ? 'unavailable:disposable' :
			result.reason === 'banned' ? 'unavailable:banned' :
			result.reason === 'mx' ? 'unavailable:mx' :
			result.reason === 'smtp' ? 'unavailable:smtp' :
			'unavailable';
	}).catch((err) => {
		if (err.name !== 'AbortError') {
			emailState.value = 'error';
		}
	});
}

function onChangePassword(): void {
	if (password.value === '') {
		passwordStrength.value = '';
		return;
	}

	const strength = getPasswordStrength(password.value);
	passwordStrength.value = strength > 0.7 ? 'high' : strength > 0.3 ? 'medium' : 'low';
}

function onChangePasswordRetype(): void {
	if (retypedPassword.value === '') {
		passwordRetypeState.value = null;
		return;
	}

	passwordRetypeState.value = password.value === retypedPassword.value ? 'match' : 'not-match';
}

const tosPrivacyPolicyLabel = computed(() => {
	if (availableTos && availablePrivacyPolicy) {
		return i18n.ts.tosAndPrivacyPolicy;
	} else if (availableTos) {
		return i18n.ts.termsOfService;
	} else if (availablePrivacyPolicy) {
		return i18n.ts.privacyPolicy;
	} else {
		return '';
	}
});

async function updateAgreeServerRules(v: boolean) {
	if (v) {
		const confirm = await os.confirm({
			type: 'question',
			title: i18n.ts.doYouAgree,
			text: i18n.tsx.iHaveReadXCarefullyAndAgree({ x: i18n.ts.serverRules }),
		});
		if (confirm.canceled) return;
		agreeServerRules.value = true;
	} else {
		agreeServerRules.value = false;
	}
}

async function updateAgreeTosAndPrivacyPolicy(v: boolean) {
	if (v) {
		const confirm = await os.confirm({
			type: 'question',
			title: i18n.ts.doYouAgree,
			text: i18n.tsx.iHaveReadXCarefullyAndAgree({
				x: tosPrivacyPolicyLabel.value,
			}),
		});
		if (confirm.canceled) return;
		agreeTosAndPrivacyPolicy.value = true;
	} else {
		agreeTosAndPrivacyPolicy.value = false;
	}
}

async function updateAgreeNote(v: boolean) {
	if (v) {
		const confirm = await os.confirm({
			type: 'question',
			title: i18n.ts.doYouAgree,
			text: i18n.tsx.iHaveReadXCarefullyAndAgree({ x: i18n.ts.basicNotesBeforeCreateAccount }),
		});
		if (confirm.canceled) return;
		agreeNote.value = true;
	} else {
		agreeNote.value = false;
	}
}

async function onSubmit(): Promise<void> {
	if (submitting.value) return;
	submitting.value = true;

	const signupPayload: Misskey.entities.SignupRequest = {
		username: username.value,
		password: password.value,
		emailAddress: email.value,
		invitationCode: invitationCode.value,
		'hcaptcha-response': hCaptchaResponse.value,
		'm-captcha-response': mCaptchaResponse.value,
		'g-recaptcha-response': reCaptchaResponse.value,
		'turnstile-response': turnstileResponse.value,
		'testcaptcha-response': testcaptchaResponse.value,
	};

	const res = await window.fetch(`${config.apiUrl}/signup`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(signupPayload),
	}).catch((networkError) => {
		onSignupApiError('ネットワークエラーが発生しました。インターネット接続を確認してください。', 'NETWORK_ERROR');
		return null;
	});

	if (res && res.ok) {
		if (res.status === 204 || instance.emailRequiredForSignup) {
			os.alert({
				type: 'success',
				title: i18n.ts._signup.almostThere,
				text: i18n.tsx._signup.emailSent({ email: email.value }),
			});
			emit('signupEmailPending');
		} else {
			const resJson = (await res.json()) as Misskey.entities.SignupResponse;
			if (_DEV_) console.log(resJson);

			emit('signup', resJson);

			if (props.autoSet) {
				await login(resJson.token);
			}
		}
	} else if (res) {
		// エラーレスポンスの詳細を取得
		try {
			const errorData = await res.json();
			const errorMessage = errorData.message || 'サインアップに失敗しました';
			const errorCode = errorData.error || `HTTP_${res.status}`;
			onSignupApiError(errorMessage, errorCode);
		} catch (parseError) {
			onSignupApiError(`サーバーエラーが発生しました (HTTP ${res.status})`, `HTTP_${res.status}`);
		}
	}

	submitting.value = false;
}

function onSignupApiError(errorDetail?: string, errorCode?: string) {
	submitting.value = false;
	hcaptcha.value?.reset?.();
	mcaptcha.value?.reset?.();
	recaptcha.value?.reset?.();
	turnstile.value?.reset?.();
	testcaptcha.value?.reset?.();

	// 詳細なエラーメッセージの表示
	const errorMessage = errorDetail || i18n.ts.somethingHappened;
	const displayTitle = errorCode ? `エラー: ${errorCode}` : 'エラーが発生しました';

	os.alert({
		type: 'error',
		title: displayTitle,
		text: errorMessage,
	});

	// Slackにフロントエンドエラーを送信
	sendErrorToSlack(errorDetail, errorCode);
}

async function sendErrorToSlack(errorDetail?: string, errorCode?: string) {
	try {
		const errorData = {
			type: 'SIGNUP_ERROR',
			message: errorDetail || '不明なサインアップエラー',
			errorCode: errorCode || 'UNKNOWN_ERROR',
			userAgent: navigator.userAgent,
			timestamp: new Date().toISOString(),
			url: window.location.href,
			username: username.value || '未入力',
			invitationCode: invitationCode.value || '未使用',
			email: email.value || '未入力'
		};

		await window.fetch(`${config.apiUrl}/log-frontend-error`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(errorData),
		});
	} catch (slackError) {
		// Slack送信エラーは無視（ユーザーには表示しない）
		console.error('Failed to send error to Slack:', slackError);
	}
}
</script>

<style lang="scss" module>
.banner {
	padding: 16px;
	text-align: center;
	font-size: 26px;
	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
}

.captcha {
	margin: 16px 0;
}

.tosSection {
	padding: 12px;
	background-color: var(--MI_THEME-panel);
	border-radius: 8px;
	border: 1px solid var(--MI_THEME-divider);
}

.rulesPreview {
	background: var(--MI_THEME-bg);
	border-radius: 4px;
	padding: 8px;
	font-size: 12px;
	max-height: 120px;
	overflow-y: auto;
	margin-bottom: 8px;
}
</style>
