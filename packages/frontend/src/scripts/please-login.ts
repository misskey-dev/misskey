/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent } from 'vue';
import { $i } from '@/account.js';
import { i18n } from '@/i18n.js';
import { popup } from '@/os.js';

export type OpenOnRemoteOptions = {
	/**
	 * 外部のMisskey Webで特定のパスを開く
	 */
	type: 'web';

	/**
	 * 内部パス（例: `/settings`）
	 */
	path: string;
} | {
	/**
	 * 外部のMisskey Webで照会する
	 */
	type: 'lookup';

	/**
	 * 照会したいエンティティのURL
	 *
	 * （例: `https://misskey.example.com/notes/abcdexxxxyz`）
	 */
	url: string;
} | {
	/**
	 * 外部のMisskeyでノートする
	 */
	type: 'share';

	/**
	 * `/share` ページに渡すクエリストリング
	 *
	 * @see https://go.misskey-hub.net/spec/share/
	 */
	params: Record<string, string>;
};

export function pleaseLogin(opts: {
	path?: string;
	message?: string;
	openOnRemote?: OpenOnRemoteOptions;
} = {}) {
	if ($i) return;

	const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkSigninDialog.vue')), {
		autoSet: true,
		message: opts.message ?? (opts.openOnRemote ? i18n.ts.signinOrContinueOnRemote : i18n.ts.signinRequired),
		openOnRemote: opts.openOnRemote,
	}, {
		cancelled: () => {
			if (opts.path) {
				window.location.href = opts.path;
			}
		},
		closed: () => dispose(),
	});

	throw new Error('signin required');
}
