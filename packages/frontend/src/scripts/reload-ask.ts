/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { unisonReload } from '@/scripts/unison-reload.js';

let isReloadConfirming = false;

export async function reloadAsk(opts: {
	unison?: boolean;
	reason?: string;
}) {
	if (isReloadConfirming) {
		return;
	}

	isReloadConfirming = true;

	const { canceled } = await os.confirm(opts.reason == null ? {
		type: 'info',
		text: i18n.ts.reloadConfirm,
	} : {
		type: 'info',
		title: i18n.ts.reloadConfirm,
		text: opts.reason,
	}).finally(() => {
		isReloadConfirming = false;
	});

	if (canceled) return;

	if (opts.unison) {
		unisonReload();
	} else {
		location.reload();
	}
}
