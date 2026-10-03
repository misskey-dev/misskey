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
import { computed } from 'vue';
import { i18n } from '@/i18n.js';
import { dateTimeFormat } from '@@/js/intl-const.js';
import { parseTime, formatRelativeTime } from '@@/js/relative-time.js';
import { useLowresTime } from '@@/js/use-lowres-time.js';

const props = withDefaults(defineProps<{
	time: Date | string | number | null;
	origin?: Date | null;
	mode?: 'relative' | 'absolute' | 'detail';
	colored?: boolean;
}>(), {
	origin: null,
	mode: 'relative',
});

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const _time = parseTime(props.time);
const invalid = Number.isNaN(_time);
const absolute = !invalid ? dateTimeFormat.format(_time) : i18n.ts._ago.invalid;

const actualNow = useLowresTime();
const now = computed(() => (props.origin ? props.origin.getTime() : actualNow.value));

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const ago = computed(() => (now.value - _time) / 1000/*ms*/);

const relative = computed<string>(() => {
	if (props.mode === 'absolute') return ''; // absoluteではrelativeを使わないので計算しない
	if (invalid) return i18n.ts._ago.invalid;

	return formatRelativeTime(i18n, ago.value);
});
</script>

<style lang="scss" module>
.old1 {
	color: var(--MI_THEME-warn);
}

.old1.old2 {
	color: var(--MI_THEME-error);
}
</style>
