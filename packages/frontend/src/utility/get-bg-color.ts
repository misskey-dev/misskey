/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import tinycolor from 'tinycolor2';

export const getBgColor = (elem?: Element | null): string | null => {
	if (elem == null) return null;

	const { backgroundColor: bg } = window.getComputedStyle(elem);

	if (bg && tinycolor(bg).getAlpha() !== 0) {
		return bg;
	}

	return getBgColor(elem.parentElement);
};
