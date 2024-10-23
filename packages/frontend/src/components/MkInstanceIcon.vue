<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<img v-if="faviconUrl" :class="$style.instanceIcon" :src="faviconUrl"/>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { instance as Instance } from '@/instance.js';
import { getProxiedImageUrlNullable } from '@/scripts/media-proxy.js';
const props = defineProps<{
	instance?: {
		faviconUrl?: string | null
	}
}>();
const faviconUrl = computed(() => props.instance ? getProxiedImageUrlNullable(props.instance.faviconUrl, 'preview') : getProxiedImageUrlNullable(Instance.iconUrl, 'preview') ?? '/favicon.ico');
</script>

<style lang="scss" module>
.instanceIcon {
	width: 25px;
	height: 25px;
	border-radius: 50%;
	opacity: 0.7;
	background: var(--MI_THEME-panel);
	box-shadow: 0 0 0 2px var(--MI_THEME-panel);
}

@container (max-width: 580px) {
	.instanceIcon {
		width: 21px;
		height: 21px;
	}
}

@container (max-width: 450px) {
	.instanceIcon {
		width: 19px;
		height: 19px;
	}
}

@container (max-width: 300px) {
	.instanceIcon {
		width: 17px;
		height: 17px;
	}
}
</style>
