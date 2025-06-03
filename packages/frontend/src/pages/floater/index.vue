<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="recent" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<XFloater ref="floaterComponent" :anchorDate="anchorDate"/>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, ref, provide, useTemplateRef } from 'vue';
import XFloater from './floater.vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import PageWithHeader from '@/components/global/PageWithHeader.vue';
import { deviceKind } from '@/utility/device-kind.js';

// タブUIの表示のためにこのプロバイダーを追加
provide('shouldOmitHeaderTitle', true);

// フロータータイムラインのコンポーネント参照
const floaterComponent = useTemplateRef('floaterComponent');

// 最初から文字列として初期化
const recent = ref('86400000');

// 表示期間の設定
const anchorDate = computed(() => {
	const date = new Date();
	// recent の値をミリ秒として解釈し、現在時刻からその分だけ過去の時点を計算
	date.setTime(date.getTime() - parseInt(recent.value));
	return date.getTime();
});

// ヘッダータブ
const headerTabs = computed(() => [
	// タブのkeyも文字列として定義、タイムラインのようにiconOnlyを追加
	{ key: '3600000', title: i18n.tsx.recentNHours({ n: 1 }), icon: 'ti ti-clock', iconOnly: true },
	{ key: '86400000', title: i18n.tsx.recentNDays({ n: 1 }), icon: 'ti ti-calendar', iconOnly: true },
	{ key: '259200000', title: i18n.tsx.recentNDays({ n: 3 }), icon: 'ti ti-calendar-event', iconOnly: true },
	{ key: '604800000', title: i18n.tsx.recentNDays({ n: 7 }), icon: 'ti ti-calendar-week', iconOnly: true },
	{ key: '2592000000', title: i18n.tsx.recentNDays({ n: 30 }), icon: 'ti ti-calendar-month', iconOnly: true },
]);

// タイムラインと同等のリロードボタンを追加したヘッダーアクション
const headerActions = computed(() => {
	const actions = [];

	// デスクトップの場合はリロードボタンを追加
	if (deviceKind === 'desktop') {
		actions.push({
			icon: 'ti ti-refresh',
			text: i18n.ts.reload,
			handler: () => {
				// フロータータイムラインのリロード
				floaterComponent.value?.reload();
			},
		});
	}

	return actions;
});

definePage(() => ({
	title: i18n.ts.floater,
	icon: 'ti ti-lifebuoy',
}));
</script>
