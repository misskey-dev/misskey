/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { markRaw } from 'vue';
import type { Locale } from '../../../locales';
import { locale } from '@/config';
import { I18n } from '@/scripts/i18n';

export const i18n = markRaw(new I18n<Locale>(locale));

export function updateI18n(newLocale) {
	i18n.ts = newLocale;
}
