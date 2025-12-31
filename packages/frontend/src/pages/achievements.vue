<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 1200px;">
		<MkAchievements :user="$i"/>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { onActivated, onDeactivated, onMounted, onUnmounted } from 'vue';
import MkAchievements from '@/components/MkAchievements.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { ensureSignin } from '@/i.js';
import { claimAchievement } from '@/utility/achievements.js';

const $i = ensureSignin();

let timer: number | null;

function viewAchievements3min() {
	claimAchievement('viewAchievements3min');
}

onMounted(() => {
	if (timer == null) timer = window.setTimeout(viewAchievements3min, 1000 * 60 * 3);
});

onUnmounted(() => {
	if (timer != null) {
		window.clearTimeout(timer);
		timer = null;
	}
});

onActivated(() => {
	if (timer == null) timer = window.setTimeout(viewAchievements3min, 1000 * 60 * 3);
});

onDeactivated(() => {
	if (timer != null) {
		window.clearTimeout(timer);
		timer = null;
	}
});

definePage(() => ({
	title: i18n.ts.achievements,
	icon: 'ti ti-medal',
}));
</script>

<style lang="scss" module>

</style>
