<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" class="_pageScrollable">
	<div class="_spacer" :class="$style.main">
		<MkButton v-if="read" :class="$style.button" rounded @click="read = false"><i class="ti ti-qrcode"></i> {{ i18n.ts._qr.showTabTitle }}</MkButton>
		<MkButton v-else :class="$style.button" rounded @click="read = true"><i class="ti ti-scan"></i> {{ i18n.ts._qr.readTabTitle }}</MkButton>

		<MkQrRead v-if="read"/>
		<MkQrShow v-else/>
	</div>
	<MkPolkadots v-if="!read" accented revered :height="200" style="position: sticky; bottom: 0; margin-top: -200px;"/>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref, shallowRef } from 'vue';
import MkQrShow from './qr.show.vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import { ensureSignin } from '@/i';
import MkButton from '@/components/MkButton.vue';
import MkPolkadots from '@/components/MkPolkadots.vue';

// router definitionでloginRequiredが設定されているためエラーハンドリングしない
const $i = ensureSignin();

const read = ref(false);

const MkQrRead = defineAsyncComponent(() => import('./qr.read.vue'));

definePage(() => ({
	title: i18n.ts.qr,
	icon: 'ti ti-qrcode',
}));
</script>

<style lang="scss" module>
.root {
	height: 100%;
}

.main {
	min-height: 100%;
	display: flex;
	flex-direction: column;
	position: relative;
	z-index: 1;
}

.button {
	margin: 0 auto 16px auto;
}
</style>
