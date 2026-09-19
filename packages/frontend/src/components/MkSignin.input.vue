<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.wrapper" data-testid="signin-page-input">
	<div :class="$style.root">
		<div :class="$style.avatar">
			<i class="ti ti-user"></i>
		</div>

		<!-- ログイン画面メッセージ -->
		<MkInfo v-if="message">
			{{ message }}
		</MkInfo>

		<!-- 外部サーバーへの転送 -->
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

		<!-- username入力 -->
		<form class="_gaps_s" @submit.prevent="onSubmit">
			<!-- NOTE: autocomplete の末尾の webauthn は Conditional Mediation (パスキーのオートフィル) の
			           必須要件。@simplewebauthn/browser はこの input が無いと throw するので外さないこと -->
			<MkInput v-model="username" :placeholder="i18n.ts.username" type="text" pattern="^[a-zA-Z0-9_]+$" :spellcheck="false" autocomplete="username webauthn" autofocus required data-testid="signin-username">
				<template #prefix>@</template>
				<template #suffix>@{{ host }}</template>
			</MkInput>

			<!-- NOTE: captcha は 2FA の有無によらず username ステップで常に検証される -->
			<div :id="captchaBlockId">
				<MkCaptcha v-if="instance.enableHcaptcha" ref="hcaptcha" v-model="hCaptchaResponse" provider="hcaptcha" :sitekey="instance.hcaptchaSiteKey"/>
				<MkCaptcha v-if="instance.enableMcaptcha" ref="mcaptcha" v-model="mCaptchaResponse" provider="mcaptcha" :sitekey="instance.mcaptchaSiteKey" :instanceUrl="instance.mcaptchaInstanceUrl"/>
				<MkCaptcha v-if="instance.enableRecaptcha" ref="recaptcha" v-model="reCaptchaResponse" provider="recaptcha" :sitekey="instance.recaptchaSiteKey"/>
				<MkCaptcha v-if="instance.enableTurnstile" ref="turnstile" v-model="turnstileResponse" provider="turnstile" :sitekey="instance.turnstileSiteKey"/>
				<MkCaptcha v-if="showTestcaptcha" ref="testcaptcha" v-model="testcaptchaResponse" provider="testcaptcha" :sitekey="null"/>
			</div>

			<!-- NOTE: 未解答時にネイティブ disabled にするとフォーカス順から外れ、支援技術の利用者に
			           ボタンの存在も理由も伝わらない。aria-disabled にして送信は onSubmit で弾く -->
			<MkButton
				type="submit"
				:class="$style.continueButton"
				:aria-disabled="captchaFailed"
				:aria-describedby="captchaFailed ? captchaBlockId : undefined"
				large primary rounded style="margin: 0 auto;" data-testid="signin-page-input-continue"
			>{{ i18n.ts.continue }} <i class="ti ti-arrow-right"></i></MkButton>
		</form>

		<!-- パスワードレスログイン -->
		<!-- NOTE: Conditional Mediation 対応環境では username 欄のオートフィルから選べるので出さない。
		           非対応環境で消すとパスワードレス設定のユーザーがログイン手段を失うため残す -->
		<template v-if="showPasskeyButton">
			<div :class="$style.orHr">
				<p :class="$style.orMsg">{{ i18n.ts.or }}</p>
			</div>
			<div>
				<MkButton type="button" style="margin: auto auto;" large rounded primary gradate @click="emit('passkeyClick')">
					<i class="ti ti-device-usb" style="font-size: medium;"></i>{{ i18n.ts.signinWithPasskey }}
				</MkButton>
			</div>
		</template>
	</div>
</div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
import { toUnicode } from 'punycode.js';
import * as Misskey from 'misskey-js';

import { query, extractDomain } from '@@/js/url.js';
import { genId } from '@/utility/id.js';
import { host as configHost } from '@@/js/config.js';
import type { OpenOnRemoteOptions } from '@/utility/please-login.js';
import { instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';

import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkCaptcha from '@/components/MkCaptcha.vue';

const props = withDefaults(defineProps<{
	message?: string,
	openOnRemote?: OpenOnRemoteOptions,
	initialUsername?: string;
	/** パスキーログインのボタンを表示するか (親は Conditional Mediation 非対応のときだけ true を渡す) */
	showPasskeyButton?: boolean;
}>(), {
	message: '',
	openOnRemote: undefined,
	initialUsername: undefined,
	showPasskeyButton: false,
});

const emit = defineEmits<{
	(ev: 'usernameSubmitted', v: Omit<Misskey.entities.SigninContinueRequestUsername, 'sessionId'>): void;
	(ev: 'passkeyClick'): void;
}>();

const host = toUnicode(configHost);

const username = ref(props.initialUsername ?? '');

/** captcha ブロックを aria-describedby から参照するための id */
const captchaBlockId = genId();

//#region captcha
const hCaptcha = useTemplateRef('hcaptcha');
const mCaptcha = useTemplateRef('mcaptcha');
const reCaptcha = useTemplateRef('recaptcha');
const turnstile = useTemplateRef('turnstile');
const testcaptcha = useTemplateRef('testcaptcha');

const hCaptchaResponse = ref<string | null>(null);
const mCaptchaResponse = ref<string | null>(null);
const reCaptchaResponse = ref<string | null>(null);
const turnstileResponse = ref<string | null>(null);
const testcaptchaResponse = ref<string | null>(null);

type CaptchaCandidate = {
	type: Misskey.entities.SigninCaptchaResponse['type'];
	response: string | null;
};

/**
 * インスタンスで有効な captcha プロバイダを、backend (SigninApiService.verifyCaptcha) と
 * 同じ優先順位で列挙する。順位がずれると、ユーザーには理由の分からない 400 になる。
 */
const captchaCandidates = computed<CaptchaCandidate[]>(() => {
	const real: CaptchaCandidate[] = [];
	if (instance.enableHcaptcha) real.push({ type: 'hcaptcha', response: hCaptchaResponse.value });
	if (instance.enableMcaptcha) real.push({ type: 'm-captcha', response: mCaptchaResponse.value });
	if (instance.enableRecaptcha) real.push({ type: 'recaptcha-v2', response: reCaptchaResponse.value });
	if (instance.enableTurnstile) real.push({ type: 'turnstile', response: turnstileResponse.value });

	if (real.length > 0) return real;
	if (instance.enableTestcaptcha) return [{ type: 'testcaptcha', response: testcaptchaResponse.value }];
	return [];
});

/** テスト用 captcha は単独で有効なときだけ出す (本物が有効なら backend が受理しない) */
const showTestcaptcha = computed((): boolean => captchaCandidates.value.some(c => c.type === 'testcaptcha'));

const captchaResponse = computed<Misskey.entities.SigninCaptchaResponse | undefined>(() => {
	for (const candidate of captchaCandidates.value) {
		if (candidate.response != null && candidate.response !== '') {
			return { type: candidate.type, response: candidate.response };
		}
	}
	return undefined;
});

const captchaFailed = computed((): boolean => captchaCandidates.value.length > 0 && captchaResponse.value == null);

function resetCaptcha() {
	hCaptcha.value?.reset();
	mCaptcha.value?.reset();
	reCaptcha.value?.reset();
	turnstile.value?.reset();
	testcaptcha.value?.reset();
}

defineExpose({
	resetCaptcha,
});
//#endregion

function onSubmit() {
	// aria-disabled はネイティブ disabled と違って送信を止めないので、ここで弾く
	if (captchaFailed.value) return;

	emit('usernameSubmitted', {
		username: username.value,
		captchaResponse: captchaResponse.value,
	});
}

//#region Open on remote
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
	targetHost = extractDomain(targetHost ?? '');
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
//#endregion
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.wrapper {
	display: flex;
	align-items: center;
	width: 100%;
	min-height: 336px;

	> .root {
		width: 100%;
	}
}

.avatar {
	margin: 0 auto;
	background-color: color-mix(in srgb, var(--MI_THEME-fg), transparent 85%);
	color: color-mix(in srgb, var(--MI_THEME-fg), transparent 25%);
	text-align: center;
	height: 64px;
	width: 64px;
	font-size: 24px;
	line-height: 64px;
	border-radius: 50%;
}

.continueButton[aria-disabled='true'] {
	opacity: 0.5;
	cursor: default;
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
	background: var(--MI_THEME-divider);
}

.orMsg {
	position: absolute;
	top: -.6em;
	display: inline-block;
	padding: 0 1em;
	background: var(--MI_THEME-panel);
	font-size: 0.8em;
	color: var(--MI_THEME-fgOnPanel);
	margin: 0;
	left: 50%;
	transform: translateX(-50%);
}
</style>
