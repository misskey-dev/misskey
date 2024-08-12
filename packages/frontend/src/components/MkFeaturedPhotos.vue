<!--
SPDX-FileCopyrightText: syuilo and misskey-project , Type4ny-projectSPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="instance" :class="$style.root" :style="{ backgroundImage: `url(${ imgUrl })` }"></div>
</template>

<script lang="ts" setup>
import { instance } from '@/instance.js';
import { ref, onMounted } from 'vue';

const imgUrl = ref<string>('');

function shuffleArray(array: any[]) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

onMounted(() => {
	if (instance.backgroundImageUrls && instance.backgroundImageUrls.length > 0) {
		shuffleArray(instance.backgroundImageUrls);
		imgUrl.value = instance.backgroundImageUrls[0];
	}
});
</script>

<style lang="scss" module>
.root {
	background-position: center;
	background-size: cover;
}
</style>
