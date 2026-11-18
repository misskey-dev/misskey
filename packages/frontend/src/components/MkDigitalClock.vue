<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<span>
	<span v-text="hh"></span>
	<span ref="colonMEl" :class="$style.colon">:</span>
	<span v-text="mm"></span>
	<span v-if="showS" ref="colonSEl" :class="$style.colon">:</span>
	<span v-if="showS" v-text="ss"></span>
	<span v-if="showMs" ref="colonMsEl" :class="$style.colon">:</span>
	<span v-if="showMs" v-text="ms"></span>
</span>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import { defaultIdlingRenderScheduler } from '@/utility/idle-render.js';

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
const colonMEl = useTemplateRef('colonMEl');
const colonSEl = useTemplateRef('colonSEl');
const colonMsEl = useTemplateRef('colonMsEl');
let prevSec: number | null = null;

function blinkColons() {
	for (const el of [colonMEl.value, colonSEl.value, colonMsEl.value]) {
		el?.animate([
			{ opacity: 1 },
			{ opacity: 0 },
		], {
			duration: 1000,
			easing: 'ease',
		});
	}
}

const tick = (): void => {
	const now = props.now();
	now.setMinutes(now.getMinutes() + now.getTimezoneOffset() + props.offset);
	hh.value = now.getHours().toString().padStart(2, '0');
	mm.value = now.getMinutes().toString().padStart(2, '0');
	ss.value = now.getSeconds().toString().padStart(2, '0');
	ms.value = Math.floor(now.getMilliseconds() / 10).toString().padStart(2, '0');
	if (now.getSeconds() !== prevSec) blinkColons();
	prevSec = now.getSeconds();
};

tick();

onMounted(() => {
	blinkColons();
	defaultIdlingRenderScheduler.add(tick);
});

onUnmounted(() => {
	defaultIdlingRenderScheduler.delete(tick);
});
</script>

<style lang="scss" module>
.colon {
	opacity: 0;
}
</style>
