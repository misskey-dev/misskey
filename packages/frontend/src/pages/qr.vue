<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :class="$style.root" :tabs="headerTabs" :swipable="true">
	<MkQrShow v-if="tab === 'show'"/>
	<MkQrRead v-else-if="tab === 'read'"/>
	<MkError v-else-if="error" :error="error"/>
	<MkLoading v-else/>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref, shallowRef } from 'vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import { ensureSignin } from '@/i';

// router definitionでloginRequiredが設定されているためエラーハンドリングしない
const $i = ensureSignin();

const tab = ref<'read' | 'show'>('show');
const error = ref<any>(null);

const MkQrShow = defineAsyncComponent(() => import('./qr.show.vue'));
const MkQrRead = defineAsyncComponent(() => import('./qr.read.vue'));

const headerTabs = [{
	key: 'show',
	title: i18n.ts._qr.showTabTitle,
	icon: 'ti ti-qrcode',
}, {
	key: 'read',
	title: i18n.ts._qr.readTabTitle,
	icon: 'ti ti-scan',
}];

definePage(() => ({
	title: i18n.ts.qr,
	icon: 'ti ti-qrcode',
}));
</script>

<style lang="scss" module>
.root {
	height: 100%;
}
</style>
