/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { $i } from '@/i.js';
import { instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { popupAsyncWithDialog } from '@/os.js';

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

export async function pleaseLogin(opts: {
	path?: string;
	message?: string;
	openOnRemote?: OpenOnRemoteOptions;
} = {}): Promise<boolean> {
	if ($i != null) return true;

	let _openOnRemote: OpenOnRemoteOptions | undefined = undefined;

	// 連合できる場合と、（連合ができなくても）共有する場合は外部連携オプションを設定
	if (opts.openOnRemote != null && (instance.federation !== 'none' || opts.openOnRemote.type === 'share')) {
		_openOnRemote = opts.openOnRemote;
	}

	const { dispose } = await popupAsyncWithDialog(import('@/components/MkSigninDialog.vue').then(x => x.default), {
		autoSet: true,
		message: opts.message ?? (_openOnRemote ? i18n.ts.signinOrContinueOnRemote : i18n.ts.signinRequired),
		openOnRemote: _openOnRemote,
	}, {
		cancelled: () => {
			if (opts.path) {
				window.location.href = opts.path;
			}
		},
		closed: () => dispose(),
	});

	return false;
}
