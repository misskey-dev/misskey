<!--
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
-->

<script setup lang="ts">
/**
 * NoqSettings.vue
 * 質問箱設定コンポーネント
 * - 質問箱の有効/無効
 * - ユーザー名開示必須設定
 * - センシティブ質問非表示設定
 * - 質問者への注意書き
 * - NGワードリスト
 * - 質問募集中を投稿
 * - E2E暗号化公開鍵生成
 */
import { ref, onMounted } from 'vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import MkSwitch from '@/components/MkSwitch.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkInput from '@/components/MkInput.vue';

const isEnabled = ref(false);
const requireUsernameDisclosure = ref(false);
const hideSensitiveQuestions = ref(false);
const notice = ref('');
const ngWordList = ref<string[]>([]);
const ngWordInput = ref('');
const e2ePublicKey = ref<string | null>(null);

const loading = ref(true);
const saving = ref(false);
const saved = ref(false);

// E2E暗号化関連
const e2ePassword = ref('');
const generatingKey = ref(false);
const keyGenerated = ref(false);

async function load() {
	loading.value = true;
	try {
		const settings = await misskeyApi('noq/settings/get', {});
		isEnabled.value = settings.isEnabled;
		requireUsernameDisclosure.value = settings.requireUsernameDisclosure;
		hideSensitiveQuestions.value = settings.hideSensitiveQuestions;
		notice.value = settings.notice ?? '';
		ngWordList.value = settings.ngWordList;
		e2ePublicKey.value = settings.e2ePublicKey;
	} catch (err) {
		console.error(err);
	} finally {
		loading.value = false;
	}
}

async function save() {
	saving.value = true;
	saved.value = false;
	try {
		await misskeyApi('noq/settings/update', {
			isEnabled: isEnabled.value,
			requireUsernameDisclosure: requireUsernameDisclosure.value,
			hideSensitiveQuestions: hideSensitiveQuestions.value,
			notice: notice.value || null,
			ngWordList: ngWordList.value,
		});
		saved.value = true;
		window.setTimeout(() => saved.value = false, 3000);
	} catch (err) {
		console.error(err);
	} finally {
		saving.value = false;
	}
}

function addNgWord() {
	const word = ngWordInput.value.trim();
	if (word && !ngWordList.value.includes(word)) {
		ngWordList.value.push(word);
		ngWordInput.value = '';
	}
}

function removeNgWord(index: number) {
	ngWordList.value.splice(index, 1);
}

// 質問募集中を投稿する機能
const announcing = ref(false);

async function announce() {
	if (!isEnabled.value) {
		os.alert({
			type: 'warning',
			title: i18n.ts._noq.questionBoxDisabled,
			text: i18n.ts._noq.enableQuestionBox,
		});
		return;
	}

	// 公開範囲選択ダイアログ
	const { canceled, result: visibility } = await os.select({
		title: i18n.ts.visibility,
		items: [
			{ value: 'public' as const, label: i18n.ts._visibility.public },
			{ value: 'home' as const, label: i18n.ts._visibility.home },
			{ value: 'followers' as const, label: i18n.ts._visibility.followers },
		],
		default: 'public',
	});

	if (canceled) return;

	announcing.value = true;
	try {
		await misskeyApi('noq/announce', { visibility });
		os.toast(i18n.ts._noq.announceSent);
	} catch (err) {
		console.error(err);
		os.alert({
			type: 'error',
			text: String(err),
		});
	} finally {
		announcing.value = false;
	}
}

// E2E暗号化公開鍵を生成
async function generateE2eKey() {
	if (e2ePassword.value.length < 4) {
		os.alert({
			type: 'warning',
			title: i18n.ts._noq.e2e.passwordTooShort,
			text: i18n.ts._noq.e2e.passwordMinLength,
		});
		return;
	}

	// 既に公開鍵がある場合は警告
	if (e2ePublicKey.value) {
		const { canceled } = await os.confirm({
			type: 'warning',
			title: i18n.ts._noq.e2e.regenerateWarningTitle,
			text: i18n.ts._noq.e2e.regenerateWarningText,
		});
		if (canceled) return;
	}

	generatingKey.value = true;
	keyGenerated.value = false;
	try {
		const result = await misskeyApi('noq/settings/generate-key', {
			password: e2ePassword.value,
		});
		e2ePublicKey.value = result.publicKey;
		e2ePassword.value = '';
		keyGenerated.value = true;
		window.setTimeout(() => keyGenerated.value = false, 3000);
		os.toast(String(i18n.ts._noq.e2e.keyGenerated));
	} catch (err) {
		console.error(err);
		os.alert({
			type: 'error',
			text: String(err),
		});
	} finally {
		generatingKey.value = false;
	}
}

// 公開鍵をクリップボードにコピー
async function copyPublicKey() {
	if (!e2ePublicKey.value) return;
	await navigator.clipboard.writeText(e2ePublicKey.value);
	os.toast(String(i18n.ts.copied));
}

onMounted(() => {
	load();
});
</script>

<template>
<div v-if="!loading" class="noq-settings">
	<MkSwitch v-model="isEnabled" class="setting-item">
		{{ i18n.ts._noq.enableQuestionBox }}
	</MkSwitch>

	<MkSwitch v-model="requireUsernameDisclosure" class="setting-item">
		{{ i18n.ts._noq.requireUsernameDisclosure }}
	</MkSwitch>

	<MkSwitch v-model="hideSensitiveQuestions" class="setting-item">
		{{ i18n.ts._noq.hideSensitiveQuestions }}
	</MkSwitch>

	<div class="setting-item">
		<label class="label">{{ i18n.ts._noq.notice }}</label>
		<MkTextarea
			v-model="notice"
			:placeholder="i18n.ts._noq.noticePlaceholder"
			:max="1000"
		/>
	</div>

	<div class="setting-item">
		<label class="label">{{ i18n.ts._noq.ngWordList }}</label>
		<p class="description">{{ i18n.ts._noq.ngWordListDescription }}</p>

		<div class="ng-word-input">
			<input
				v-model="ngWordInput"
				type="text"
				class="input"
				@keyup.enter="addNgWord"
			/>
			<MkButton @click="addNgWord">{{ i18n.ts.add }}</MkButton>
		</div>

		<div v-if="ngWordList.length > 0" class="ng-word-list">
			<div v-for="(word, index) in ngWordList" :key="index" class="ng-word-item">
				<span>{{ word }}</span>
				<button class="remove" @click="removeNgWord(index)">x</button>
			</div>
		</div>
	</div>

	<div class="actions">
		<MkButton :disabled="saving" primary @click="save">
			{{ i18n.ts.save }}
		</MkButton>
		<MkInfo v-if="saved" class="saved-message">{{ i18n.ts.saved }}</MkInfo>
	</div>

	<div v-if="isEnabled" class="announce-section">
		<label class="label">{{ i18n.ts._noq.announce }}</label>
		<p class="description">{{ i18n.ts._noq.announceDescription }}</p>
		<MkButton :disabled="announcing" @click="announce">
			<i class="ti ti-speakerphone"></i> {{ i18n.ts._noq.postAnnounce }}
		</MkButton>
	</div>

	<div v-if="isEnabled" class="e2e-section">
		<label class="label"><i class="ti ti-lock"></i> {{ i18n.ts._noq.e2e.title }}</label>
		<p class="description">{{ i18n.ts._noq.e2e.description }}</p>
		<MkInfo class="e2e-warning" warn>{{ i18n.ts._noq.e2e.securityWarning }}</MkInfo>

		<div v-if="e2ePublicKey" class="public-key-display">
			<label class="label">{{ i18n.ts._noq.e2e.yourPublicKey }}</label>
			<div class="key-container">
				<code class="key">{{ e2ePublicKey }}</code>
				<MkButton @click="copyPublicKey">
					<i class="ti ti-copy"></i>
				</MkButton>
			</div>
		</div>

		<div class="key-generation">
			<label class="label">{{ e2ePublicKey ? i18n.ts._noq.e2e.regenerateKey : i18n.ts._noq.e2e.generateKey }}</label>
			<p class="description">{{ i18n.ts._noq.e2e.passwordNote }}</p>
			<MkInput v-model="e2ePassword" type="password" :placeholder="i18n.ts._noq.e2e.passwordPlaceholder" class="password-input" />
			<MkButton :disabled="generatingKey || e2ePassword.length < 4" @click="generateE2eKey">
				<i class="ti ti-key"></i> {{ e2ePublicKey ? i18n.ts._noq.e2e.regenerate : i18n.ts._noq.e2e.generate }}
			</MkButton>
			<MkInfo v-if="keyGenerated" class="key-generated-message">{{ i18n.ts._noq.e2e.keyGenerated }}</MkInfo>
		</div>
	</div>
</div>
<div v-else class="loading">
	Loading...
</div>
</template>

<style scoped lang="scss">
.noq-settings {
	padding: 16px;

	.setting-item {
		margin-bottom: 24px;

		.label {
			display: block;
			font-weight: bold;
			margin-bottom: 8px;
		}

		.description {
			font-size: 0.9em;
			color: var(--fgTransparent);
			margin-bottom: 8px;
		}
	}

	.ng-word-input {
		display: flex;
		gap: 8px;
		margin-bottom: 12px;

		.input {
			flex: 1;
			padding: 8px 12px;
			border: 1px solid var(--divider);
			border-radius: 6px;
			background: var(--bg);
			color: var(--fg);

			&:focus {
				border-color: var(--accent);
				outline: none;
			}

			&::placeholder {
				color: var(--fgTransparent);
			}
		}
	}

	.ng-word-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;

		.ng-word-item {
			display: flex;
			align-items: center;
			gap: 4px;
			padding: 4px 8px;
			background: var(--buttonBg);
			border-radius: 4px;

			.remove {
				background: none;
				border: none;
				color: var(--error);
				cursor: pointer;
				padding: 0 4px;
				font-size: 1.1em;
			}
		}
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-top: 24px;

		.saved-message {
			margin: 0;
		}
	}

	.announce-section {
		margin-top: 32px;
		padding-top: 24px;
		border-top: 1px solid var(--divider);

		.label {
			display: block;
			font-weight: bold;
			margin-bottom: 8px;
		}

		.description {
			font-size: 0.9em;
			color: var(--fgTransparent);
			margin-bottom: 12px;
		}
	}

	.e2e-section {
		margin-top: 32px;
		padding-top: 24px;
		border-top: 1px solid var(--divider);

		.label {
			display: flex;
			align-items: center;
			gap: 8px;
			font-weight: bold;
			margin-bottom: 8px;
		}

		.description {
			font-size: 0.9em;
			color: var(--fgTransparent);
			margin-bottom: 12px;
		}

		.e2e-warning {
			margin-bottom: 16px;
		}

		.public-key-display {
			margin-bottom: 24px;
			padding: 16px;
			background: var(--buttonBg);
			border-radius: 8px;

			.key-container {
				display: flex;
				align-items: center;
				gap: 8px;
				margin-top: 8px;

				.key {
					flex: 1;
					padding: 8px 12px;
					background: var(--panel);
					border-radius: 4px;
					font-family: monospace;
					font-size: 0.95em;
					word-break: break-all;
				}
			}
		}

		.key-generation {
			.password-input {
				margin-bottom: 12px;
			}

			.key-generated-message {
				margin-top: 12px;
			}
		}
	}
}

.loading {
	padding: 32px;
	text-align: center;
	color: var(--fgTransparent);
}
</style>
