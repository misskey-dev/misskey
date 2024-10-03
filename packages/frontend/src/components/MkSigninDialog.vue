<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="400"
	:height="450"
	@close="onClose"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.login }}</template>

	<MkSpacer :marginMin="20" :marginMax="28">
		<MkSignin :autoSet="autoSet" :message="message" :openOnRemote="openOnRemote" @login="onLogin"/>
	</MkSpacer>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue';
import type { OpenOnRemoteOptions } from '@/scripts/please-login.js';
import MkSignin from '@/components/MkSignin.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n.js';

withDefaults(defineProps<{
	autoSet?: boolean;
	message?: string,
	openOnRemote?: OpenOnRemoteOptions,
}>(), {
	autoSet: false,
	message: '',
	openOnRemote: undefined,
});

const emit = defineEmits<{
	(ev: 'done', v: any): void;
	(ev: 'closed'): void;
	(ev: 'cancelled'): void;
}>();

const dialog = shallowRef<InstanceType<typeof MkModalWindow>>();

function onClose() {
	emit('cancelled');
	if (dialog.value) dialog.value.close();
}

function onLogin(res) {
	emit('done', res);
	if (dialog.value) dialog.value.close();
}
</script>
