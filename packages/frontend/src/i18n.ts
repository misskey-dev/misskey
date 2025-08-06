/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { markRaw } from 'vue';
import { I18n } from '@@/js/i18n.js';
import { lang, version } from '@@/js/config.js';
import type { Locale } from '../../../locales/index.js';

const locale = await window.fetch(`/assets/locales/${lang}.${version}.json`).then(r => r.json());
export const i18n = markRaw(new I18n<Locale>(locale, _DEV_));

export function updateI18n(newLocale: Locale) {
	i18n.locale = newLocale;
}
