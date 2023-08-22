<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal
	ref="dialogEl"
	:preferType="'dialog'"
	:zPriority="'low'"
	@click="cancel"
	@close="cancel"
	@closed="emit('closed')"
>
	<div :class="$style.root" class="_gaps_m">
		<I18n :src="i18n.ts._2fa.step1" tag="div">
			<template #a>
				<a href="https://authy.com/" rel="noopener" target="_blank" class="_link">Authy</a>
			</template>
			<template #b>
				<a href="https://support.google.com/accounts/answer/1066447" rel="noopener" target="_blank" class="_link">Google Authenticator</a>
			</template>
		</I18n>
		<div>
			{{ i18n.ts._2fa.step2 }}<br>
			{{ i18n.ts._2fa.step2Click }}
		</div>
		<a :href="twoFactorData.url"><img :class="$style.qr" :src="twoFactorData.qr"></a>
		<MkKeyValue :copy="twoFactorData.url">
			<template #key>{{ i18n.ts._2fa.step2Url }}</template>
			<template #value>{{ twoFactorData.url }}</template>
		</MkKeyValue>
		<div class="_buttons">
			<MkButton primary @click="ok">{{ i18n.ts.next }}</MkButton>
			<MkButton @click="cancel">{{ i18n.ts.cancel }}</MkButton>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import MkButton from '@/components/MkButton.vue';
import MkModal from '@/components/MkModal.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import { i18n } from '@/i18n';

defineProps<{
	twoFactorData: {
		qr: string;
		url: string;
	};
}>();

const emit = defineEmits<{
	(ev: 'ok'): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const cancel = () => {
	emit('cancel');
	emit('closed');
};

const ok = () => {
	emit('ok');
	emit('closed');
};
</script>

<style lang="scss" module>
.root {
	position: relative;
	margin: auto;
	padding: 32px;
	min-width: 320px;
	max-width: calc(100svw - 64px);
	box-sizing: border-box;
	background: var(--panel);
	border-radius: var(--radius);
}

.qr {
    width: 20em;
    max-width: 100%;
}
</style>
