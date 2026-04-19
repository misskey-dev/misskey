/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { markRaw } from 'vue';
import { I18n } from '@@/js/i18n.js';
import { locale } from '@@/js/locale.js';
import type { Locale } from 'i18n';

export const i18n = markRaw(new I18n<Locale>(locale, _DEV_));

// test 以外では使わないこと。インライン化されてるのでだいたい意味がない
export function updateI18n(newLocale: Locale) {
	i18n.locale = newLocale;
}
