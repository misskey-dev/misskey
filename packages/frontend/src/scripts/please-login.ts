/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent } from 'vue';
import { $i } from '@/account.js';
import { i18n } from '@/i18n.js';
import { popup } from '@/os.js';

export function pleaseLogin(path?: string) {
	if ($i) return;

	popup(defineAsyncComponent(() => import('@/components/MkSigninDialog.vue')), {
		autoSet: true,
		message: i18n.ts.signinRequired,
	}, {
		cancelled: () => {
			if (path) {
				window.location.href = path;
			}
		},
	}, 'closed');

	throw new Error('signin required');
}
