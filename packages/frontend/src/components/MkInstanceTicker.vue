<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	:class="$style.root"
	:style="tickerColorsRef"
>
	<img :class="$style.icon" :src="tickerInfoRef.iconUrl"/>
	<div :class="$style.name">{{ tickerInfoRef.name }}</div>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { getTickerColors, getTickerInfo } from '@/utility/instance-ticker.js';

export type TickerProps = {
	readonly instance?: {
		readonly name?: string | null;
		// NOTE: リモートサーバーにおいてiconUrlを参照すると意図した画像にならない https://github.com/taiyme/misskey/issues/210
		// readonly iconUrl?: string | null;
		readonly faviconUrl?: string | null;
		readonly themeColor?: string | null;
	} | null;
	readonly channel?: {
		readonly name: string;
		readonly color: string;
	} | null;
};

const props = defineProps<TickerProps>();

const tickerInfoRef = computed(() => getTickerInfo(props));
const tickerColorsRef = computed(() => getTickerColors(tickerInfoRef.value));
</script>

<style lang="scss" module>
.root {
	overflow: hidden;
	overflow: clip;
	display: block;
	box-sizing: border-box;
	background-color: var(--ticker-bg, #777777);
	color: var(--ticker-fg, #ffffff);

	--ticker-size: 2ex;
	display: grid;
	align-items: center;
	grid-template: var(--ticker-size) / var(--ticker-size) 1fr;
	gap: 4px;
	border-radius: 4px;

	> .icon {
		width: var(--ticker-size);
		height: var(--ticker-size);
	}

	> .name {
		line-height: var(--ticker-size);
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
	}
}

.icon {
	display: block;
	aspect-ratio: 1 / 1;
	box-sizing: border-box;
}

.name {
	display: block;
	font-size: 0.9em;
	font-weight: bold;
	box-sizing: border-box;
}
</style>
