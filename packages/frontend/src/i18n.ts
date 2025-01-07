/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { markRaw } from 'vue';
import { I18n } from 'frontend-shared/js/i18n';
import type { Locale } from '../../../locales/index.js';
import { locale } from 'frontend-shared/js/config';

export const i18n = markRaw(new I18n<Locale>(locale, _DEV_));

export function updateI18n(newLocale: Locale) {
	i18n.locale = newLocale;
}
