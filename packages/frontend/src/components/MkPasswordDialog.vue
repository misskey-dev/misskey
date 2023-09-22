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
		<div>{{ i18n.ts.authenticationRequiredToContinue }}</div>

		<MkInput v-model="password" :placeholder="i18n.ts.password" type="password" autocomplete="current-password webauthn" :withPasswordToggle="true">
			<template #prefix><i class="ti ti-lock"></i></template>
		</MkInput>

		<MkInput v-model="token" type="text" pattern="^([0-9]{6}|[A-Z0-9]{32})$" autocomplete="one-time-code" :spellcheck="false">
			<template #label>{{ i18n.ts.token }}</template>
			<template #prefix><i class="ti ti-123"></i></template>
		</MkInput>

		<MkButton primary rounded @click="done">{{ i18n.ts.continue }}</MkButton>
	</MkSpacer>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkInput from '@/components/MkInput.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n.js';

const emit = defineEmits<{
	(ev: 'done', v: any): void;
	(ev: 'closed'): void;
	(ev: 'cancelled'): void;
}>();

const dialog = $shallowRef<InstanceType<typeof MkModalWindow>>();
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
</script>
