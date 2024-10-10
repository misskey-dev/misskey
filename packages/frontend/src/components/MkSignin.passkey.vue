<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.wrapper">
	<div class="_gaps" :class="$style.root">
		<div class="_gaps_s">
			<div :class="$style.passkeyIcon">
				<i class="ti ti-fingerprint"></i>
			</div>
			<div :class="$style.passkeyDescription">{{ i18n.ts.useSecurityKey }}</div>
		</div>

		<MkButton large primary rounded :disabled="queryingKey" style="margin: 0 auto;" @click="queryKey">{{ i18n.ts.retry }}</MkButton>

		<MkButton v-if="isPerformingPasswordlessLogin !== true" transparent rounded :disabled="queryingKey" style="margin: 0 auto;" @click="emit('useTotp')">{{ i18n.ts.useTotp }}</MkButton>
	</div>
</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { get as webAuthnRequest } from '@github/webauthn-json/browser-ponyfill';

import { i18n } from '@/i18n.js';

import MkButton from '@/components/MkButton.vue';

import type { AuthenticationPublicKeyCredential } from '@github/webauthn-json/browser-ponyfill';

const props = defineProps<{
	credentialRequest: CredentialRequestOptions;
	isPerformingPasswordlessLogin?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'done', credential: AuthenticationPublicKeyCredential): void;
	(ev: 'useTotp'): void;
}>();

const queryingKey = ref(true);

async function queryKey() {
	queryingKey.value = true;
	await webAuthnRequest(props.credentialRequest)
		.catch(() => {
			return Promise.reject(null);
		})
		.then((credential) => {
			emit('done', credential);
		})
		.finally(() => {
			queryingKey.value = false;
		});
}

onMounted(() => {
	queryKey();
});
</script>

<style lang="scss" module>
.wrapper {
	display: flex;
	align-items: center;
	width: 100%;
	min-height: 336px;

	> .root {
		width: 100%;
	}
}

.passkeyIcon {
	margin: 0 auto;
	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	text-align: center;
	height: 64px;
	width: 64px;
	font-size: 24px;
	line-height: 64px;
	border-radius: 50%;
}

.passkeyDescription {
	text-align: center;
	font-size: 1.1em;
}
</style>
