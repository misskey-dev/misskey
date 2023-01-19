<template>
<div>
	<div v-if="achievements" class="_gaps">
		<div v-for="achievement in achievements" :key="achievement" :class="$style.achievement" class="_panel">
			<div :class="$style.icon">
				<div :class="[$style.iconFrame, $style['iconFrame_' + ACHIEVEMENT_BADGES[achievement.name].frame]]">
					<div :class="[$style.iconInner]" :style="{ background: ACHIEVEMENT_BADGES[achievement.name].bg }">
						<img :class="$style.iconImg" :src="ACHIEVEMENT_BADGES[achievement.name].img">
					</div>
				</div>
			</div>
			<div :class="$style.body">
				<div :class="$style.header">
					<span :class="$style.title">{{ i18n.ts._achievements._types['_' + achievement.name].title }}</span>
					<span :class="$style.time">
						{{ i18n.ts._achievements.earnedAt }}: <MkTime mode="absolute" :time="new Date(achievement.unlockedAt)"/>
					</span>
				</div>
				<div :class="$style.description">{{ i18n.ts._achievements._types['_' + achievement.name].description }}</div>
				<div v-if="i18n.ts._achievements._types['_' + achievement.name].flavor" :class="$style.flavor">{{ i18n.ts._achievements._types['_' + achievement.name].flavor }}</div>
			</div>
		</div>
		<template v-if="withLocked">
			<div v-for="achievement in lockedAchievements" :key="achievement" :class="[$style.achievement, $style.locked]" class="_panel">
				<div :class="$style.icon">
				</div>
				<div :class="$style.body">
					<div :class="$style.header">
						<span :class="$style.title">{{ i18n.ts._achievements._types['_' + achievement].title }}</span>
					</div>
					<div :class="$style.description">???</div>
				</div>
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
import { ACHIEVEMENT_TYPES, ACHIEVEMENT_BADGES } from '@/scripts/achievements';

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
	display: flex;
	padding: 16px;

	&.locked {
		opacity: 0.5;
	}
}

.icon {
	flex-shrink: 0;
	margin-right: 12px;
}

.iconFrame {
	width: 58px;
	height: 58px;
	padding: 6px;
	border-radius: 100%;
	box-sizing: border-box;
}
.iconFrame_bronze {
	background: linear-gradient(0deg, #703827, #d37566);
}

.iconInner {
	position: relative;
	width: 100%;
	height: 100%;
	border-radius: 100%;
}

.iconImg {
	width: calc(100% - 12px);
	height: calc(100% - 12px);
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	margin: auto;
	filter: drop-shadow(0px 2px 3px #000);
}

.body {
	flex: 1;
	min-width: 0;
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
