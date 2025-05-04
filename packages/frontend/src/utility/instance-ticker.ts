/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { host } from '@@/js/config.js';
import { instance as localInstance } from '@/instance.js';
import { getProxiedImageUrlNullable } from '@/utility/media-proxy.js';
import { hexToRgb } from '@/utility/color.js';
import type { HEX } from '@/utility/color.js';
import type { TickerProps } from '@/components/MkInstanceTicker.vue';

//#region ticker info
type TickerInfo = {
	readonly name: string;
	readonly iconUrl: string;
	readonly themeColor: string;
};

const TICKER_BG_COLOR_DEFAULT = '#777777' as const;

export const getTickerInfo = (props: TickerProps): TickerInfo => {
	if (props.channel != null) {
		return {
			name: props.channel.name,
			iconUrl: getProxiedIconUrl(localInstance) ?? '/favicon.ico',
			themeColor: props.channel.color,
		} as const satisfies TickerInfo;
	}
	if (props.instance != null) {
		return {
			name: props.instance.name ?? '',
			iconUrl: getProxiedIconUrl(props.instance) ?? '/client-assets/dummy.png',
			themeColor: props.instance.themeColor ?? TICKER_BG_COLOR_DEFAULT,
		} as const satisfies TickerInfo;
	}
	return {
		name: localInstance.name ?? host,
		iconUrl: getProxiedIconUrl(localInstance) ?? '/favicon.ico',
		themeColor: localInstance.themeColor ?? document.querySelector<HTMLMetaElement>('meta[name="theme-color-orig"]')?.content ?? TICKER_BG_COLOR_DEFAULT,
	} as const satisfies TickerInfo;
};

const getProxiedIconUrl = (instance: NonNullable<TickerProps['instance']>): string | null => {
	return getProxiedImageUrlNullable(instance.iconUrl, 'preview') ?? getProxiedImageUrlNullable(instance.faviconUrl, 'preview') ?? null;
};
//#endregion ticker info

//#region ticker colors
type TickerColors = {
	readonly '--ticker-bg': string;
	readonly '--ticker-fg': string;
	readonly '--ticker-bg-rgb': string;
};

const TICKER_YUV_THRESHOLD = 191 as const;
const TICKER_FG_COLOR_LIGHT = '#ffffff' as const;
const TICKER_FG_COLOR_DARK = '#2f2f2fcc' as const;

const tickerColorsCache = new Map<HEX, TickerColors>();

export const getTickerColors = (info: TickerInfo): TickerColors => {
	const bgHex = info.themeColor;
	const cachedTickerColors = tickerColorsCache.get(bgHex);
	if (cachedTickerColors != null) return cachedTickerColors;

	const { r, g, b } = hexToRgb(bgHex);
	const yuv = 0.299 * r + 0.587 * g + 0.114 * b;
	const fgHex = yuv > TICKER_YUV_THRESHOLD ? TICKER_FG_COLOR_DARK : TICKER_FG_COLOR_LIGHT;

	const tickerColors = {
		'--ticker-fg': fgHex,
		'--ticker-bg': bgHex,
		'--ticker-bg-rgb': `${r}, ${g}, ${b}`,
	} as const satisfies TickerColors;

	tickerColorsCache.set(bgHex, tickerColors);

	return tickerColors;
};
//#endregion ticker colors
