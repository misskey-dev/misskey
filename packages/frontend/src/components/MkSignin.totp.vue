<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.wrapper">
	<div class="_gaps" :class="$style.root">
		<div class="_gaps_s">
			<div :class="$style.totpIcon">
				<i class="ti ti-key"></i>
			</div>
			<div :class="$style.totpDescription">{{ i18n.ts['2fa'] }}</div>
		</div>

		<!-- totp入力 -->
		<form class="_gaps_s" @submit.prevent="emit('totpSubmitted', token)">
			<MkInput v-model="token" type="text" :pattern="isBackupCode ? '^[A-Z0-9]{32}$' :'^[0-9]{6}$'" autocomplete="one-time-code" required autofocus :spellcheck="false" :inputmode="isBackupCode ? undefined : 'numeric'">
				<template #label>{{ i18n.ts.token }} ({{ i18n.ts['2fa'] }})</template>
				<template #prefix><i v-if="isBackupCode" class="ti ti-key"></i><i v-else class="ti ti-123"></i></template>
				<template #caption><button class="_textButton" type="button" @click="isBackupCode = !isBackupCode">{{ isBackupCode ? i18n.ts.useTotp : i18n.ts.useBackupCode }}</button></template>
			</MkInput>

			<MkButton type="submit" large primary rounded style="margin: 0 auto;">{{ i18n.ts.continue }} <i class="ti ti-arrow-right"></i></MkButton>
		</form>
	</div>
</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { i18n } from '@/i18n.js';

import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';

const emit = defineEmits<{
	(ev: 'totpSubmitted', token: string): void;
}>();

const token = ref('');
const isBackupCode = ref(false);
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

.totpIcon {
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

.totpDescription {
	text-align: center;
	font-size: 1.1em;
}
</style>
