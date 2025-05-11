<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 1000px; --MI_SPACER-min: 20px;">
	<MkInstanceStats/>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';
import { i18n } from '@/i18n.js';
import { claimAchievement } from '@/utility/achievements.js';
import { definePage } from '@/page.js';

const MkInstanceStats = defineAsyncComponent(() => import('@/components/MkInstanceStats.vue'));

// アチーブメントの付与
claimAchievement('viewInstanceChart');

definePage(() => ({
	title: i18n.ts.charts,
	icon: 'ti ti-chart-line',
}));
</script>
