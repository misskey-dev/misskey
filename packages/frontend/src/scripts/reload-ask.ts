/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { unisonReload } from '@/scripts/unison-reload.js';

let isReloadConfirming = false;

export async function reloadAsk() {
	if (isReloadConfirming) {
		return;
	}

	isReloadConfirming = true;

	const { canceled } = await os.confirm({
		type: 'info',
		text: i18n.ts.reloadToApplySetting,
	});

	if (!canceled) {
		unisonReload();
	}

	isReloadConfirming = false;
}
