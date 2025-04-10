/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { markRaw } from 'vue';
import { I18n } from '@@/js/i18n.js';
import type { Locale } from '../../../locales/index.js';
import { locale } from '@@/js/config.js';

export const i18n = markRaw(new I18n<Locale>(locale, _DEV_));

export function updateI18n(newLocale: Locale) {
	i18n.locale = newLocale;
}
