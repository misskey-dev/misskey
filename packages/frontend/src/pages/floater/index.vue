<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="recent" :actions="headerActions" :tabs="headerTabs"/></template>
	<div class="_spacer" style="--MI_SPACER-w: 1000px;">
		<Transition name="fade" mode="out-in">
			<XFloater :anchorDate="anchorDate"/>
		</Transition>
	</div>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import XFloater from './floater.vue';
import MkRadios from '@/components/MkRadios.vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';

// 最初から文字列として初期化
const recent = ref('86400000');

const headerActions = computed(() => []);
const headerTabs = computed(() => [
	// タブのkeyも文字列として定義
	{ key: '3600000', title: i18n.tsx.recentNHours({ n: 1 }) },
	{ key: '86400000', title: i18n.tsx.recentNDays({ n: 1 }) },
	{ key: '259200000', title: i18n.tsx.recentNDays({ n: 3 }) },
	{ key: '604800000', title: i18n.tsx.recentNDays({ n: 7 }) },
	{ key: '2592000000', title: i18n.tsx.recentNDays({ n: 30 }) },
]);

const anchorDate = computed(() => {
	// 文字列を数値に変換して計算
	return new Date() - Number(recent.value);
});

definePage(() => ({
	title: i18n.ts.floater,
	icon: 'ti ti-lifebuoy',
}));
</script>

<!-- タブを中央揃えにするスタイルを追加 -->
<style lang="scss">
:deep(.mk-page-header-tabs) {
  justify-content: center !important;
}
</style>
