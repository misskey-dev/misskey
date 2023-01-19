<template>
<div>
	<div v-if="achievements" class="_gaps">
		<div v-for="achievement in achievements" :key="achievement" :class="$style.achievement" class="_panel">
			<div :class="$style.header">
				<span :class="$style.title">{{ i18n.ts._achievements._types['_' + achievement.name].title }}</span>
				<span :class="$style.time">
					{{ i18n.ts._achievements.earnedAt }}: <MkTime mode="detail" :time="new Date(achievement.unlockedAt)"/>
				</span>
			</div>
			<div :class="$style.description">{{ i18n.ts._achievements._types['_' + achievement.name].description }}</div>
			<div :class="$style.flavor">{{ i18n.ts._achievements._types['_' + achievement.name].flavor }}</div>
		</div>
		<template v-if="withLocked">
			<div v-for="achievement in lockedAchievements" :key="achievement" :class="[$style.achievement, $style.locked]" class="_panel">
				<div :class="$style.title">{{ i18n.ts._achievements._types['_' + achievement].title }}</div>
				<div :class="$style.description">???</div>
			</div>
		</template>
	</div>
	<div v-else>
		<MkLoading/>
	</div>
</div>
</template>

<script lang="ts" setup>
import * as misskey from 'misskey-js';
import { onMounted } from 'vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const ACHIEVEMENT_TYPES = [
	'justSettingUpMyMsky',
	'myFirstFollow',
	'myFirstFollower',
	'iLoveMisskey',
	'nocturnality',
] as const;

const props = withDefaults(defineProps<{
	user: misskey.entities.User;
	withLocked: boolean;
}>(), {
	withLocked: true,
});

let achievements = $ref();
const lockedAchievements = $computed(() => ACHIEVEMENT_TYPES.filter(x => !(achievements ?? []).some(a => a.name === x)));

onMounted(() => {
	os.api('users/achievements', { userId: props.user.id }).then(res => {
		achievements = res.sort((a, b) => b.unlockedAt - a.unlockedAt);
	});
});
</script>

<style lang="scss" module>
.achievement {
	padding: 16px;

	&.locked {
		opacity: 0.5;
	}
}

.header {
	margin-bottom: 8px;
	display: flex;
}

.title {
	font-weight: bold;
}

.time {
	margin-left: auto;
	font-size: 90%;
}

.description {
	font-size: 90%;
}

.flavor {
	opacity: 0.7;
	transform: skewX(-15deg);
	font-size: 85%;
	margin-top: 8px;
}
</style>
