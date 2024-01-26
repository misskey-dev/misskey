/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent } from 'vue';
import { $i } from '@/account.js';
import { i18n } from '@/i18n.js';
import { popup } from '@/os.js';

export type MisskeyHubOptions = {
	type: 'web';
	path: string;
} | {
	type: 'share';
	params: Record<string, string>;
};

export function pleaseLogin(path?: string, misskeyHub?: MisskeyHubOptions) {
	if ($i) return;

	popup(defineAsyncComponent(() => import('@/components/MkSigninDialog.vue')), {
		autoSet: true,
		message: misskeyHub ? i18n.ts.signinOrContinueOnRemote : i18n.ts.signinRequired,
		misskeyHub,
	}, {
		cancelled: () => {
			if (path) {
				window.location.href = path;
			}
		},
	}, 'closed');

	throw new Error('signin required');
}
