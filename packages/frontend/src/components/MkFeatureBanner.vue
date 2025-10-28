<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-panel :class="$style.root">
	<img :class="$style.img" :src="icon"/>
	<div :class="$style.text">
		<slot></slot>
	</div>
</div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
	icon: string;
	color: string;
}>(), {
});
</script>

<style module lang="scss">
.root {
	padding: 20px 24px;
	text-align: center;
	border-radius: var(--MI-radius);
	background: linear-gradient(180deg, color(from v-bind(color) srgb r g b / 0.1), color(from v-bind(color) srgb r g b / 0));
}

.img {
	display: block;
	margin: 0 auto;
	width: 40px;
	aspect-ratio: 1;
}

.text {
	margin-top: 12px;
	font-size: 85%;
	mix-blend-mode: luminosity;
}
</style>
