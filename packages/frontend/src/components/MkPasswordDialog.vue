<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="370"
	:height="400"
	@close="onClose"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.authentication }}</template>

	<MkSpacer :marginMin="20" :marginMax="28">
		<div style="padding: 0 0 16px 0; text-align: center;">
			<img src="/fluent-emoji/1f510.png" alt="🔐" style="display: block; margin: 0 auto; width: 48px;">
			<div style="margin-top: 16px;">{{ i18n.ts.authenticationRequiredToContinue }}</div>
		</div>

		<div class="_gaps">
			<MkInput ref="passwordInput" v-model="password" :placeholder="i18n.ts.password" type="password" autocomplete="current-password webauthn" :withPasswordToggle="true">
				<template #prefix><i class="ti ti-password"></i></template>
			</MkInput>

			<MkInput v-if="$i.twoFactorEnabled" v-model="token" type="text" pattern="^([0-9]{6}|[A-Z0-9]{32})$" autocomplete="one-time-code" :spellcheck="false">
				<template #label>{{ i18n.ts.token }} ({{ i18n.ts['2fa'] }})</template>
				<template #prefix><i class="ti ti-123"></i></template>
			</MkInput>

			<MkButton :disabled="(password ?? '') == '' || ($i.twoFactorEnabled && (token ?? '') == '')" primary rounded style="margin: 0 auto;" @click="done"><i class="ti ti-lock-open"></i> {{ i18n.ts.continue }}</MkButton>
		</div>
	</MkSpacer>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n.js';
import { $i } from '@/account.js';

const emit = defineEmits<{
	(ev: 'done', v: { password: string; token: string | null; }): void;
	(ev: 'closed'): void;
	(ev: 'cancelled'): void;
}>();

const dialog = $shallowRef<InstanceType<typeof MkModalWindow>>();
const passwordInput = $shallowRef<InstanceType<typeof MkInput>>();
const password = $ref('');
const token = $ref(null);

function onClose() {
	emit('cancelled');
	if (dialog) dialog.close();
}

function done(res) {
	emit('done', { password, token });
	if (dialog) dialog.close();
}

onMounted(() => {
	if (passwordInput) passwordInput.focus();
});
</script>
