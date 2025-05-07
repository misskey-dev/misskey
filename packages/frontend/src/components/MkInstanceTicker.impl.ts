/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import tinycolor from 'tinycolor2';

type ITickerColors = {
	readonly bg: string;
	readonly fg: string;
};

const TICKER_YUV_THRESHOLD = 191 as const;
const TICKER_FG_COLOR_LIGHT = '#ffffff' as const;
const TICKER_FG_COLOR_DARK = '#2f2f2fcc' as const;

const tickerColorsCache = new Map<string, ITickerColors>();

export const getTickerColors = (bgHex: string): ITickerColors => {
	const cachedTickerColors = tickerColorsCache.get(bgHex);
	if (cachedTickerColors != null) return cachedTickerColors;

	const tinycolorInstance = tinycolor(bgHex);
	const { r, g, b } = tinycolorInstance.toRgb();
	const yuv = 0.299 * r + 0.587 * g + 0.114 * b;
	const fgHex = yuv > TICKER_YUV_THRESHOLD ? TICKER_FG_COLOR_DARK : TICKER_FG_COLOR_LIGHT;

	const tickerColors = {
		fg: fgHex,
		bg: bgHex,
	} as const satisfies ITickerColors;

	tickerColorsCache.set(tinycolorInstance.toHex(), tickerColors);

	return tickerColors;
};
