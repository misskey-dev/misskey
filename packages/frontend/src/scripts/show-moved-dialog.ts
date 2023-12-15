/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from '@/os.js';
import { $i } from '@/account.js';
import { i18n } from '@/i18n.js';

export function showMovedDialog() {
	if (!$i) return;
	if (!$i.movedTo) return;

	os.alert({
		type: 'error',
		title: i18n.ts.accountMovedShort,
		text: i18n.ts.operationForbidden,
	});

	throw new Error('account moved');
}
