/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { post } from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { $i } from '@/i.js';
import { getAccountFromId } from '@/utility/get-account-from-id.js';
import { deepClone } from '@/utility/clone.js';
import { mainRouter } from '@/router.js';
import { login } from '@/accounts.js';

export function swInject() {
	navigator.serviceWorker.addEventListener('message', async ev => {
		if (_DEV_) {
			console.log('sw msg', ev.data);
		}

		if (ev.data.type !== 'order') return;

		if (ev.data.loginId && ev.data.loginId !== $i?.id) {
			return getAccountFromId(ev.data.loginId).then(account => {
				if (!account) return;
				return login(account.token, ev.data.url);
			});
		}

		switch (ev.data.order) {
			case 'post': {
				const props = deepClone(ev.data.options);
				// プッシュ通知から来たreply,renoteはtruncateBodyが通されているため、
				// 完全なノートを取得しなおす
				if (props.reply) {
					props.reply = await misskeyApi('notes/show', { noteId: props.reply.id });
				}
				if (props.renote) {
					props.renote = await misskeyApi('notes/show', { noteId: props.renote.id });
				}
				return post(props);
			}
			case 'push':
				if (mainRouter.currentRoute.value.path === ev.data.url) {
					return window.scroll({ top: 0, behavior: 'smooth' });
				}
				return mainRouter.pushByPath(ev.data.url);
			default:
				return;
		}
	});
}
