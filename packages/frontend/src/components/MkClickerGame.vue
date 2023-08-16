<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div v-if="game.ready" :class="$style.game">
		<div :class="$style.cps" class="">{{ number(cps) }}cps</div>
		<div :class="$style.count" class=""><i class="ti ti-cookie" style="font-size: 70%;"></i> {{ number(cookies) }}</div>
		<button v-click-anime class="_button" @click="onClick">
			<img src="/client-assets/cookie.png" :class="$style.img">
		</button>
	</div>
	<div v-else>
		<MkLoading/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted } from 'vue';
import MkPlusOneEffect from '@/components/MkPlusOneEffect.vue';
import * as os from '@/os';
import { useInterval } from '@/scripts/use-interval';
import * as game from '@/scripts/clicker-game';
import number from '@/filters/number';
import { claimAchievement } from '@/scripts/achievements';

const saveData = game.saveData;
const cookies = computed(() => saveData.value?.cookies);
let cps = $ref(0);
let prevCookies = $ref(0);

function onClick(ev: MouseEvent) {
	const x = ev.clientX;
	const y = ev.clientY;
	os.popup(MkPlusOneEffect, { x, y }, {}, 'end');

	saveData.value!.cookies++;
	saveData.value!.totalCookies++;
	saveData.value!.totalHandmadeCookies++;
	saveData.value!.clicked++;

	if (cookies.value === 1) {
		claimAchievement('cookieClicked');
	}
}

useInterval(() => {
	const diff = saveData.value!.cookies - prevCookies;
	cps = diff;
	prevCookies = saveData.value!.cookies;
}, 1000, {
	immediate: false,
	afterMounted: true,
});

useInterval(game.save, 1000 * 5, {
	immediate: false,
	afterMounted: true,
});

onMounted(async () => {
	await game.load();
	prevCookies = saveData.value!.cookies;
});

onUnmounted(() => {
	game.save();
});
</script>

<style lang="scss" module>
.game {
	padding: 16px;
	text-align: center;
}

.cps {
	position: absolute;
	top: 12px;
	left: 12px;
	opacity: 0.5;
}

.count {
	font-size: 1.3em;
	margin-bottom: 6px;
}

.img {
	max-width: 90px;
}
</style>
