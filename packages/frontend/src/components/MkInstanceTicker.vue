<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" :style="themeColorStyle">
	<img v-if="faviconUrl" :class="$style.icon" :src="faviconUrl"/>
	<div :class="$style.name">{{ instanceName }}</div>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import tinycolor from 'tinycolor2';
import { instanceName as localInstanceName } from '@@/js/config.js';
import type { CSSProperties } from 'vue';
import { instance as localInstance } from '@/instance.js';
import { getProxiedImageUrlNullable } from '@/utility/media-proxy.js';

const props = defineProps<{
	host: string | null;
	instance?: {
		faviconUrl?: string | null
		name?: string | null
		themeColor?: string | null
	}
}>();

// if no instance data is given, this is for the local instance
const instanceName = computed(() => props.host == null ? localInstanceName : props.instance?.name ?? props.host);

const faviconUrl = computed(() => {
	let imageSrc: string | null = null;
	if (props.host == null) {
		if (localInstance.iconUrl == null) {
			return '/favicon.ico';
		} else {
			imageSrc = localInstance.iconUrl;
		}
	} else {
		imageSrc = props.instance?.faviconUrl ?? null;
	}
	return getProxiedImageUrlNullable(imageSrc);
});

type ITickerColors = {
	readonly bg: string;
	readonly fg: string;
};

const TICKER_YUV_THRESHOLD = 191 as const;
const TICKER_FG_COLOR_LIGHT = '#ffffff' as const;
const TICKER_FG_COLOR_DARK = '#2f2f2fcc' as const;

function getTickerColors(bgHex: string): ITickerColors {
	const tinycolorInstance = tinycolor(bgHex);
	const { r, g, b } = tinycolorInstance.toRgb();
	const yuv = 0.299 * r + 0.587 * g + 0.114 * b;
	const fgHex = yuv > TICKER_YUV_THRESHOLD ? TICKER_FG_COLOR_DARK : TICKER_FG_COLOR_LIGHT;

	return {
		fg: fgHex,
		bg: bgHex,
	} as const satisfies ITickerColors;
}

const themeColorStyle = computed<CSSProperties>(() => {
	const themeColor = (props.host == null ? localInstance.themeColor : props.instance?.themeColor) ?? '#777777';
	const colors = getTickerColors(themeColor);
	return {
		background: `linear-gradient(90deg, ${colors.bg}, ${colors.bg}00)`,
		color: colors.fg,
	};
});
</script>

<style lang="scss" module>
$height: 2ex;

.root {
	display: flex;
	align-items: center;
	height: $height;
	border-radius: 4px 0 0 4px;
	overflow: clip;

	// text-shadowは重いから使うな

	mask-image: linear-gradient(90deg,
		rgb(0,0,0),
		rgb(0,0,0) calc(100% - 16px),
		rgba(0,0,0,0) 100%
	);
}

.icon {
	height: $height;
	flex-shrink: 0;
}

.name {
	margin-left: 4px;
	line-height: 1;
	font-size: 0.9em;
	font-weight: bold;
	white-space: nowrap;
	overflow: visible;
}
</style>
