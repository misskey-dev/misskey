<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div :class="$style.titlebarDrag"></div>
	<div :class="$style.contentRoot">
		<div :class="$style.title">
			<img :src="instance.iconUrl || '/favicon.ico'" alt="" :class="$style.instanceIcon"/>
			<span :class="$style.instanceTitle">{{ instance.name ?? host }}</span>
		</div>
		<div :class="$style.controls">
			<span :class="$style.left">
				<button v-if="canBack" class="_button" :class="$style.button" @click="goBack"><i class="ti ti-arrow-left"></i></button>
			</span>
			<span :class="$style.right">
			</span>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { host } from '@@/js/config.js';
import { ref } from 'vue';
import { instance } from '@/instance.js';
import { prefer } from '@/preferences.js';

const canBack = ref(true);

function goBack() {
	window.history.back();
}
</script>

<style lang="scss" module>
.root {
	--height: env(titlebar-area-height, 32px);
	position: relative;
	height: var(--height);
}

.titlebarDrag {
	app-region: drag;
	-webkit-app-region: drag;
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.contentRoot {
	position: absolute;
	top: 0;
	left: env(titlebar-area-x, 0);
	width: env(titlebar-area-width, 100%);
	height: 100%;
	background: var(--MI_THEME-navBg);
	font-size: min(90%, calc(var(--height) * 0.45));
}

.title {
	display: flex;
	justify-content: center;
	align-items: center;
	text-align: center;
	height: var(--height);
}

.controls {
	app-region: no-drag;
	-webkit-app-region: no-drag;
	position: absolute;
	top: 0;
	left: 0;
	display: flex;
	justify-content: center;
	align-items: center;
	height: var(--height);
}

.instanceIcon {
	display: inline-block;
	width: min(20px, calc(var(--height) * 0.625));
	aspect-ratio: 1;
	border-radius: 5px;
	margin-right: 8px;
}

.instanceTitle {
	display: inline-block;
}

.left {
	margin-right: auto;
}

.right {
	margin-left: auto;
}

.button {
	display: inline-block;
	height: var(--height);
	aspect-ratio: 1;
}
</style>
