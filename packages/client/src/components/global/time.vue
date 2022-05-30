<template>
<time :title="absolute">
	<template v-if="mode === 'relative'">{{ relative }}</template>
	<template v-else-if="mode === 'absolute'">{{ absolute }}</template>
	<template v-else-if="mode === 'detail'">{{ absolute }} ({{ relative }})</template>
</time>
</template>

<script lang="ts" setup>
import { onUnmounted } from 'vue';
import { i18n } from '@/i18n';

const props = withDefaults(defineProps<{
	time: Date | string;
	mode?: 'relative' | 'absolute' | 'detail';
}>(), {
	mode: 'relative',
});

const _time = typeof props.time === 'string' ? new Date(props.time) : props.time;
const absolute = _time.toLocaleString();

let now = $ref(new Date());
const relative = $computed(() => {
	const ago = (now.getTime() - _time.getTime()) / 1000/*ms*/;
	return (
		ago >= 31536000 ? i18n.t('_ago.yearsAgo',   { n: Math.round(ago / 31536000).toString() }) :
		ago >= 2592000  ? i18n.t('_ago.monthsAgo',  { n: Math.round(ago / 2592000).toString() }) :
		ago >= 604800   ? i18n.t('_ago.weeksAgo',   { n: Math.round(ago / 604800).toString() }) :
		ago >= 86400    ? i18n.t('_ago.daysAgo',    { n: Math.round(ago / 86400).toString() }) :
		ago >= 3600     ? i18n.t('_ago.hoursAgo',   { n: Math.round(ago / 3600).toString() }) :
		ago >= 60       ? i18n.t('_ago.minutesAgo', { n: (~~(ago / 60)).toString() }) :
		ago >= 10       ? i18n.t('_ago.secondsAgo', { n: (~~(ago % 60)).toString() }) :
		ago >= -1       ? i18n.ts._ago.justNow :
		i18n.ts._ago.future);
});

function tick() {
	// TODO: パフォーマンス向上のため、このコンポーネントが画面内に表示されている場合のみ更新する
	now = new Date();

	tickId = window.setTimeout(() => {
		window.requestAnimationFrame(tick);
	}, 10000);
}

let tickId: number;

if (props.mode === 'relative' || props.mode === 'detail') {
	tickId = window.requestAnimationFrame(tick);

	onUnmounted(() => {
		window.clearTimeout(tickId);
	});
}
</script>
