/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from '@/os.js';
import { i18n } from '@/i18n.js';

export function showSuspendedDialog() {
	return os.alert({
		type: 'error',
		title: i18n.ts.yourAccountSuspendedTitle,
		text: i18n.ts.yourAccountSuspendedDescription,
	});
}
