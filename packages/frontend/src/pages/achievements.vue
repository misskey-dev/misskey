<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :content-max="1200">
		<MkAchievements :user="$i"/>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { onActivated, onDeactivated, onMounted, onUnmounted, ref } from 'vue';
import MkAchievements from '@/components/MkAchievements.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { $i } from '@/account';
import { claimAchievement } from '@/scripts/achievements';

let timer;

function viewAchievements3min() {
	claimAchievement('viewAchievements3min');
}

onMounted(() => {
	if (timer == null) timer = window.setTimeout(viewAchievements3min, 1000 * 60 * 3);
});

onUnmounted(() => {
	window.clearTimeout(timer);
	timer = null;
});

onActivated(() => {
	if (timer == null) timer = window.setTimeout(viewAchievements3min, 1000 * 60 * 3);
});

onDeactivated(() => {
	window.clearTimeout(timer);
	timer = null;
});

definePageMetadata({
	title: i18n.ts.achievements,
	icon: 'ti ti-military-award',
});
</script>

<style lang="scss" module>

</style>
