<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<img v-if="faviconUrl" :class="$style.topleftIcon" :src="faviconUrl"/>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { getProxiedImageUrlNullable } from '@/scripts/media-proxy.js';
const props = defineProps<{
	instance?: {
		faviconUrl?: string | null
	}
}>();
const faviconUrl = computed(() => getProxiedImageUrlNullable(props.instance?.faviconUrl, 'preview') ?? '/favicon.ico');
</script>

<style lang="scss" module>
.topleftIcon {
	width: 25px;
	height: 25px;
	border-radius: 50%;
	opacity: 0.7;
	background: var(--MI_THEME-panel);
	box-shadow: 0 0 0 2px var(--MI_THEME-panel);
}

@container (max-width: 580px) {
	.topleftIcon {
		width: 21px;
		height: 21px;
	}
}

@container (max-width: 450px) {
	.topleftIcon {
		width: 19px;
		height: 19px;
	}
}

@container (max-width: 300px) {
	.topleftIcon {
		width: 17px;
		height: 17px;
	}
}
</style>
