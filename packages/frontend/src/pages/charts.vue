<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<script lang="ts" setup>
import { defineAsyncComponent, computed } from 'vue';
import { i18n } from '@/i18n.js';
import { claimAchievement } from '@/utility/achievements.js';
import { definePage } from '@/page.js';
import { $i } from '@/i.js';

const MkInstanceStats = defineAsyncComponent(() => import('@/components/MkInstanceStats.vue'));

// 権限チェック
const canView = computed(() => {
	return $i && ($i.isAdmin || $i.policies.canViewCharts);
});

// 権限がある場合のみアチーブメントを付与
if (canView.value) {
	claimAchievement('viewInstanceChart');
}

definePage(() => ({
	title: i18n.ts.charts,
	icon: 'ti ti-chart-line',
}));
</script>

<template>
<div v-if="canView" class="_spacer" style="--MI_SPACER-w: 1000px; --MI_SPACER-min: 20px;">
	<MkInstanceStats/>
</div>
<div v-else class="_gaps">
	<MkError>
		<template #icon><i class="ti ti-lock"></i></template>
		<template #title>{{ i18n.ts.accessDenied }}</template>
		<template #description>{{ i18n.ts.youNeedPermissionToViewCharts }}</template>
	</MkError>
</div>
</template>
