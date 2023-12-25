<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<span>
	<span v-text="hh"></span>
	<span :class="[$style.colon, { [$style.showColon]: showColon }]">:</span>
	<span v-text="mm"></span>
	<span v-if="showS" :class="[$style.colon, { [$style.showColon]: showColon }]">:</span>
	<span v-if="showS" v-text="ss"></span>
	<span v-if="showMs" :class="[$style.colon, { [$style.showColon]: showColon }]">:</span>
	<span v-if="showMs" v-text="ms"></span>
</span>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { defaultIdlingRenderScheduler } from '@/scripts/idle-render.js';

const props = withDefaults(defineProps<{
	showS?: boolean;
	showMs?: boolean;
	offset?: number;
	now?: () => Date;
}>(), {
	showS: true,
	showMs: false,
	offset: 0 - new Date().getTimezoneOffset(),
	now: () => new Date(),
});

const hh = ref('');
const mm = ref('');
const ss = ref('');
const ms = ref('');
const showColon = ref(false);
let prevSec: number | null = null;

watch(showColon, (v) => {
	if (v) {
		window.setTimeout(() => {
			showColon.value = false;
		}, 30);
	}
});

const tick = (): void => {
	const now = props.now();
	now.setMinutes(now.getMinutes() + now.getTimezoneOffset() + props.offset);
	hh.value = now.getHours().toString().padStart(2, '0');
	mm.value = now.getMinutes().toString().padStart(2, '0');
	ss.value = now.getSeconds().toString().padStart(2, '0');
	ms.value = Math.floor(now.getMilliseconds() / 10).toString().padStart(2, '0');
	if (now.getSeconds() !== prevSec) showColon.value = true;
	prevSec = now.getSeconds();
};

tick();

onMounted(() => {
	defaultIdlingRenderScheduler.add(tick);
});

onUnmounted(() => {
	defaultIdlingRenderScheduler.delete(tick);
});
</script>

<style lang="scss" module>
.colon {
	opacity: 0;
	transition: opacity 1s ease;

	&.showColon {
		opacity: 1;
		transition: opacity 0s;
	}
}
</style>
