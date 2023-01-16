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
import { dateTimeFormat } from '@/scripts/intl-const';

const props = withDefaults(defineProps<{
	time: Date | string;
	mode?: 'relative' | 'absolute' | 'detail';
}>(), {
	mode: 'relative',
});

const _time = typeof props.time === 'string' ? new Date(props.time) : props.time;
const absolute = dateTimeFormat.format(_time);

let now = $shallowRef(new Date());
const relative = $computed(() => {
	const ago = (now.getTime() - _time.getTime()) / 1000/*ms*/;
	return (
		ago >= 31536000 ? i18n.t('_ago.yearsAgo', { n: Math.round(ago / 31536000).toString() }) :
		ago >= 2592000 ? i18n.t('_ago.monthsAgo', { n: Math.round(ago / 2592000).toString() }) :
		ago >= 604800 ? i18n.t('_ago.weeksAgo', { n: Math.round(ago / 604800).toString() }) :
		ago >= 86400 ? i18n.t('_ago.daysAgo', { n: Math.round(ago / 86400).toString() }) :
		ago >= 3600 ? i18n.t('_ago.hoursAgo', { n: Math.round(ago / 3600).toString() }) :
		ago >= 60 ? i18n.t('_ago.minutesAgo', { n: (~~(ago / 60)).toString() }) :
		ago >= 10 ? i18n.t('_ago.secondsAgo', { n: (~~(ago % 60)).toString() }) :
		ago >= -1 ? i18n.ts._ago.justNow :
		i18n.ts._ago.future);
});

let tickId: number;

function tick() {
	now = new Date();
	const ago = (now.getTime() - _time.getTime()) / 1000/*ms*/;
	const next = ago < 60 ? 10000 : ago < 3600 ? 60000 : 180000;

	tickId = window.setTimeout(tick, next);
}

if (props.mode === 'relative' || props.mode === 'detail') {
	tick();

	onUnmounted(() => {
		window.clearTimeout(tickId);
	});
}
</script>
