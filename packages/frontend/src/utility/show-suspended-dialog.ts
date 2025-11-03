/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from '@/os.js';
import { i18n } from '@/i18n.js';

export function showSuspendedDialog(reason?: string) {
	const text = reason
		? `${i18n.ts.yourAccountSuspendedDescription}\n\n${i18n.ts.reason}: ${reason}`
		: i18n.ts.yourAccountSuspendedDescription;

	return os.alert({
		type: 'error',
		title: i18n.ts.yourAccountSuspendedTitle,
		text: text,
	});
}
