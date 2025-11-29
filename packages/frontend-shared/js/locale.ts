/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { lang, version } from '@@/js/config.js';
import type { Locale } from 'i18n';

// ここはビルド時に const locale = JSON.parse("...") みたいな感じで置き換えられるので top-level await は消える
export let locale: Locale = await window.fetch(`/assets/locales/${lang}.${version}.json`).then(r => r.json(), () => null);

export function updateLocale(newLocale: Locale): void {
	locale = newLocale;
}
