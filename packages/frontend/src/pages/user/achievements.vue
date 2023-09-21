<template>
<MkSpacer :content-max="1200">
	<MkAchievements :user="user" :with-locked="false" :with-description="$i != null && (props.user.id === $i.id)"/>
</MkSpacer>
</template>

<script lang="ts" setup>
import { onActivated, onDeactivated, onMounted, onUnmounted } from 'vue';
import * as misskey from 'misskey-js';
import MkAchievements from '@/components/MkAchievements.vue';
import { claimAchievement } from '@/scripts/achievements';
import { $i } from '@/account';

const props = defineProps<{
	user: misskey.entities.User;
}>();

let timer: number | null;

function viewAchievements3min() {
	if ($i && (props.user.id === $i.id)) {
		claimAchievement('viewAchievements3min');
	}
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
</script>

<style lang="scss" module>

</style>
