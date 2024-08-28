<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<time :title="absolute" :class="{ [$style.old1]: colored && (ago > 60 * 60 * 24 * 90), [$style.old2]: colored && (ago > 60 * 60 * 24 * 180) }">
	<template v-if="invalid">{{ i18n.ts._ago.invalid }}</template>
	<template v-else-if="mode === 'relative'">{{ relative }}</template>
	<template v-else-if="mode === 'absolute'">{{ absolute }}</template>
	<template v-else-if="mode === 'detail'">{{ absolute }} ({{ relative }})</template>
</time>
</template>

<script lang="ts" setup>
import isChromatic from 'chromatic/isChromatic';
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { i18n } from '@/i18n.js';
import { dateTimeFormat } from '@/scripts/intl-const.js';

const props = withDefaults(defineProps<{
	time: Date | string | number | null;
	origin?: Date | null;
	mode?: 'relative' | 'absolute' | 'detail';
	colored?: boolean;
}>(), {
	origin: isChromatic() ? () => new Date('2023-04-01T00:00:00Z') : null,
	mode: 'relative',
});

function getDateSafe(n: Date | string | number) {
	try {
		if (n instanceof Date) {
			return n;
		}
		return new Date(n);
	} catch (err) {
		return {
			getTime: () => NaN,
		};
	}
}

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const _time = props.time == null ? NaN : getDateSafe(props.time).getTime();
const invalid = Number.isNaN(_time);
const absolute = !invalid ? dateTimeFormat.format(_time) : i18n.ts._ago.invalid;

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const now = ref(props.origin?.getTime() ?? Date.now());
const ago = computed(() => (now.value - _time) / 1000/*ms*/);

const relative = computed<string>(() => {
	if (props.mode === 'absolute') return ''; // absoluteではrelativeを使わないので計算しない
	if (invalid) return i18n.ts._ago.invalid;

	return (
		ago.value >= 31536000 ? i18n.tsx._ago.yearsAgo({ n: Math.round(ago.value / 31536000).toString() }) :
		ago.value >= 2592000 ? i18n.tsx._ago.monthsAgo({ n: Math.round(ago.value / 2592000).toString() }) :
		ago.value >= 604800 ? i18n.tsx._ago.weeksAgo({ n: Math.round(ago.value / 604800).toString() }) :
		ago.value >= 86400 ? i18n.tsx._ago.daysAgo({ n: Math.round(ago.value / 86400).toString() }) :
		ago.value >= 3600 ? i18n.tsx._ago.hoursAgo({ n: Math.round(ago.value / 3600).toString() }) :
		ago.value >= 60 ? i18n.tsx._ago.minutesAgo({ n: (~~(ago.value / 60)).toString() }) :
		ago.value >= 10 ? i18n.tsx._ago.secondsAgo({ n: (~~(ago.value % 60)).toString() }) :
		ago.value >= -3 ? i18n.ts._ago.justNow :
		ago.value < -31536000 ? i18n.tsx._timeIn.years({ n: Math.round(-ago.value / 31536000).toString() }) :
		ago.value < -2592000 ? i18n.tsx._timeIn.months({ n: Math.round(-ago.value / 2592000).toString() }) :
		ago.value < -604800 ? i18n.tsx._timeIn.weeks({ n: Math.round(-ago.value / 604800).toString() }) :
		ago.value < -86400 ? i18n.tsx._timeIn.days({ n: Math.round(-ago.value / 86400).toString() }) :
		ago.value < -3600 ? i18n.tsx._timeIn.hours({ n: Math.round(-ago.value / 3600).toString() }) :
		ago.value < -60 ? i18n.tsx._timeIn.minutes({ n: (~~(-ago.value / 60)).toString() }) :
		i18n.tsx._timeIn.seconds({ n: (~~(-ago.value % 60)).toString() })
	);
});

let tickId: number;
let currentInterval: number;

function tick() {
	now.value = Date.now();
	const nextInterval = ago.value < 60 ? 10000 : ago.value < 3600 ? 60000 : 180000;

	if (currentInterval !== nextInterval) {
		if (tickId) window.clearInterval(tickId);
		currentInterval = nextInterval;
		tickId = window.setInterval(tick, nextInterval);
	}
}

if (!invalid && props.origin === null && (props.mode === 'relative' || props.mode === 'detail')) {
	onMounted(() => {
		tick();
	});
	onUnmounted(() => {
		if (tickId) window.clearInterval(tickId);
	});
}
</script>

<style lang="scss" module>
.old1 {
	color: var(--warn);
}

.old1.old2 {
	color: var(--error);
}
</style>
