/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Locale } from '../../../locales/index.js';

const preParseLocale = localStorage.getItem('locale');
export let locale: Locale = preParseLocale ? JSON.parse(preParseLocale) : null;

export function updateLocale(newLocale: Locale): void {
	locale = newLocale;
}
