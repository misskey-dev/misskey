<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="recent" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div class="_spacer" style="--MI_SPACER-w: 1000px;">
		<Transition name="fade" mode="out-in">
			<XFloater :key="recent" :anchorDate="anchorDate"/>
		</Transition>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, ref, provide } from 'vue';
import XFloater from './floater.vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import PageWithHeader from '@/components/global/PageWithHeader.vue';

// タブUIの表示のためにこのプロバイダーを追加
provide('shouldOmitHeaderTitle', true);

// 最初から文字列として初期化
const recent = ref('86400000');

const headerActions = computed(() => []);
const headerTabs = computed(() => [
	// タブのkeyも文字列として定義、タイムラインのようにiconOnlyを追加
	{ key: '3600000', title: i18n.tsx.recentNHours({ n: 1 }), icon: 'ti ti-clock', iconOnly: true },
	{ key: '86400000', title: i18n.tsx.recentNDays({ n: 1 }), icon: 'ti ti-calendar', iconOnly: true },
	{ key: '259200000', title: i18n.tsx.recentNDays({ n: 3 }), icon: 'ti ti-calendar-event', iconOnly: true },
	{ key: '604800000', title: i18n.tsx.recentNDays({ n: 7 }), icon: 'ti ti-calendar-week', iconOnly: true },
	{ key: '2592000000', title: i18n.tsx.recentNDays({ n: 30 }), icon: 'ti ti-calendar-month', iconOnly: true },
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
