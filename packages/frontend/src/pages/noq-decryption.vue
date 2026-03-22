<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs" /></template>
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div class="_gaps_m">
			<MkInfo>{{ i18n.ts._noq.e2e.description }}</MkInfo>
			<MkInfo warn>{{ i18n.ts._noq.e2e.securityWarning }}</MkInfo>

			<div class="decryption-form">
				<FormSection>
					<template #label>{{ i18n.ts._noq.e2e.decryptionPage }}</template>

					<div class="_gaps_m">
						<MkInput v-model="password" type="password">
							<template #label>{{ i18n.ts._noq.e2e.enterPassword }}</template>
							<template #caption>{{ i18n.ts._noq.e2e.passwordNote }}</template>
						</MkInput>

						<MkTextarea v-model="cipherText" :placeholder="String(i18n.ts._noq.e2e.decryptionPageDescription)">
							<template #label>{{ i18n.ts._noq.questionText }}</template>
						</MkTextarea>

						<MkButton :disabled="!canDecrypt || decrypting" primary @click="doDecrypt">
							<i class="ti ti-lock-open"></i> {{ i18n.ts._noq.e2e.decrypt }}
						</MkButton>

						<div v-if="decryptionError" class="error">
							<MkInfo warn>{{ i18n.ts._noq.e2e.decryptionFailed }}</MkInfo>
						</div>

						<div v-if="decryptedText !== null" class="result">
							<div class="result-label">{{ i18n.ts._noq.e2e.decryptedText }}</div>
							<div class="result-text">{{ decryptedText }}</div>
							<MkButton @click="copyDecryptedText">
								<i class="ti ti-copy"></i> {{ i18n.ts.copy }}
							</MkButton>
						</div>
					</div>
				</FormSection>
			</div>
		</div>
	</div>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import MkInfo from '@/components/MkInfo.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkButton from '@/components/MkButton.vue';
import FormSection from '@/components/form/section.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import * as os from '@/os.js';
import { decrypt } from '@/utility/noq-crypto.js';

const password = ref('');
const cipherText = ref('');
const decryptedText = ref<string | null>(null);
const decryptionError = ref(false);

const canDecrypt = computed(() => {
	return password.value.length >= 4 && cipherText.value.trim().length > 0;
});

const decrypting = ref(false);

async function doDecrypt() {
	decryptionError.value = false;
	decryptedText.value = null;
	decrypting.value = true;

	try {
		const result = await decrypt(cipherText.value.trim(), password.value);
		if (result === null) {
			decryptionError.value = true;
		} else {
			decryptedText.value = result;
		}
	} catch {
		decryptionError.value = true;
	} finally {
		decrypting.value = false;
	}
}

async function copyDecryptedText() {
	if (decryptedText.value === null) return;
	await navigator.clipboard.writeText(decryptedText.value);
	os.toast(String(i18n.ts.copied));
}

const headerActions = computed(() => []);
const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts._noq.e2e.decryptionPage,
	icon: 'ti ti-lock-open',
}));
</script>

<style scoped lang="scss">
.decryption-form {
	.error {
		margin-top: 16px;
	}

	.result {
		margin-top: 16px;
		padding: 16px;
		background: var(--buttonBg);
		border-radius: 8px;

		.result-label {
			font-weight: bold;
			margin-bottom: 8px;
		}

		.result-text {
			padding: 12px;
			background: var(--panel);
			border-radius: 4px;
			white-space: pre-wrap;
			word-break: break-word;
			margin-bottom: 12px;
		}
	}
}
</style>
