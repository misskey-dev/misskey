/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { host } from '@@/js/config.js';
import { instance as localInstance } from '@/instance.js';
import { getProxiedImageUrlNullable } from '@/utility/media-proxy.js';
import { hexToRgb } from '@/utility/color.js';
import type { HEX } from '@/utility/color.js';

export type MkInstanceTickerProps = {
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

//#region ticker info
type ITickerInfo = {
	readonly name: string;
	readonly iconUrl: string;
	readonly themeColor: string;
};

const TICKER_BG_COLOR_DEFAULT = '#777777' as const;

export const getTickerInfo = (props: MkInstanceTickerProps): ITickerInfo => {
	if (props.channel != null) {
		return {
			name: props.channel.name,
			iconUrl: getProxiedImageUrlNullable(localInstance.iconUrl, 'preview') ?? '/favicon.ico',
			themeColor: props.channel.color,
		} as const satisfies ITickerInfo;
	}
	if (props.instance != null) {
		return {
			name: props.instance.name ?? '',
			// NOTE: リモートサーバーにおいてiconUrlを参照すると意図した画像にならない https://github.com/taiyme/misskey/issues/210
			iconUrl: getProxiedImageUrlNullable(props.instance.faviconUrl, 'preview') ?? '/client-assets/dummy.png',
			themeColor: props.instance.themeColor ?? TICKER_BG_COLOR_DEFAULT,
		} as const satisfies ITickerInfo;
	}
	return {
		name: localInstance.name ?? host,
		iconUrl: getProxiedImageUrlNullable(localInstance.iconUrl, 'preview') ?? '/favicon.ico',
		themeColor: localInstance.themeColor ?? document.querySelector<HTMLMetaElement>('meta[name="theme-color-orig"]')?.content ?? TICKER_BG_COLOR_DEFAULT,
	} as const satisfies ITickerInfo;
};
//#endregion ticker info

//#region ticker colors
type ITickerColors = {
	readonly '--ticker-bg': string;
	readonly '--ticker-fg': string;
};

const TICKER_YUV_THRESHOLD = 191 as const;
const TICKER_FG_COLOR_LIGHT = '#ffffff' as const;
const TICKER_FG_COLOR_DARK = '#2f2f2fcc' as const;

const tickerColorsCache = new Map<HEX, ITickerColors>();

export const getTickerColors = (info: ITickerInfo): ITickerColors => {
	const bgHex = info.themeColor;
	const cachedTickerColors = tickerColorsCache.get(bgHex);
	if (cachedTickerColors != null) return cachedTickerColors;

	const { r, g, b } = hexToRgb(bgHex);
	const yuv = 0.299 * r + 0.587 * g + 0.114 * b;
	const fgHex = yuv > TICKER_YUV_THRESHOLD ? TICKER_FG_COLOR_DARK : TICKER_FG_COLOR_LIGHT;

	const tickerColors = {
		'--ticker-fg': fgHex,
		'--ticker-bg': bgHex,
	} as const satisfies ITickerColors;

	tickerColorsCache.set(bgHex, tickerColors);

	return tickerColors;
};
//#endregion ticker colors
