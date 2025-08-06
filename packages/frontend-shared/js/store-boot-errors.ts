/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Locale } from '../../../locales/index.js';

type BootLoaderLocaleBody = Locale['_bootErrors'] & { reload: Locale['reload'] };

export function storeBootloaderErrors(locale: BootLoaderLocaleBody) {
	localStorage.setItem('bootloaderLocales', JSON.stringify(locale));
}
