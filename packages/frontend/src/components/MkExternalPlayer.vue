<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<MkLoading v-if="playerUrl != null && !iframeLoaded" :class="$style.loading"/>
	<iframe
		v-if="playerUrl != null"
		:key="playerUrl"
		:class="$style.iframe"
		:src="playerUrl"
		:title="title ?? i18n.ts.video"
		:allow="playerAllow"
		:style="{
			opacity: iframeLoaded ? 1 : 0,
			transition: prefer.s.animation ? 'opacity 0.3s' : 'none',
		}"
		sandbox="allow-popups allow-popups-to-escape-sandbox allow-scripts allow-storage-access-by-user-activation allow-same-origin"
		referrerpolicy="strict-origin-when-cross-origin"
		scrolling="no"
		allowfullscreen
		@load="iframeLoaded = true"
	></iframe>
	<div v-else :class="$style.invalid">{{ i18n.ts.failedToPreviewUrl }}</div>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import type { SummalyResult } from '@misskey-dev/summaly';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import { getExternalPlayerAllow, transformPlayerUrl } from '@/utility/url-preview.js';

const props = defineProps<{
	player: SummalyResult['player'];
	title?: string | null;
}>();

const iframeLoaded = ref(false);

const playerUrl = computed(() => {
	if (props.player.url == null) return null;

	try {
		return transformPlayerUrl(props.player.url);
	} catch {
		return null;
	}
});

const playerAllow = computed(() => getExternalPlayerAllow(props.player.allow));

watch(playerUrl, () => {
	iframeLoaded.value = false;
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	width: 100%;
	height: 100%;
	min-height: 0;
	overflow: hidden;
	background: var(--MI_THEME-bg);
}

.loading,
.invalid {
	position: absolute;
	inset: 0;
	display: grid;
	place-items: center;
}

.iframe {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	border: 0;
}
</style>
