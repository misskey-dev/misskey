/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent } from 'vue';
import { $i } from '@/account.js';
import { i18n } from '@/i18n.js';
import { popup } from '@/os.js';

export type OpenOnRemoteOptions = {
	type: 'web';
	path: string;
} | {
	type: 'lookup';
	path: string;	
} | {
	type: 'share';
	params: Record<string, string>;
};

export function pleaseLogin(path?: string, openOnRemote?: OpenOnRemoteOptions) {
	if ($i) return;

	const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkSigninDialog.vue')), {
		autoSet: true,
		message: openOnRemote ? i18n.ts.signinOrContinueOnRemote : i18n.ts.signinRequired,
		openOnRemote,
	}, {
		cancelled: () => {
			if (path) {
				window.location.href = path;
			}
		},
		closed: () => dispose(),
	});

	throw new Error('signin required');
}
