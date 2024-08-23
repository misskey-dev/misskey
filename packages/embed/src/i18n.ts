/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { markRaw } from 'vue';
import type { Locale } from '../../../locales/index.js';
import { locale } from '@/config.js';
import { I18n } from '@/scripts/i18n.js';

export const i18n = markRaw(new I18n<Locale>(locale));

export function updateI18n(newLocale: Locale) {
	i18n.locale = newLocale;
}
