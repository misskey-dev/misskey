/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { api, post } from '@/os.js';
import { $i, login } from '@/account.js';
import { getAccountFromId } from '@/scripts/get-account-from-id.js';
import { mainRouter } from '@/router.js';
import { deepClone } from '@/scripts/clone.js';

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
					props.reply = await api('notes/show', { noteId: props.reply.id });
				}
				if (props.renote) {
					props.renote = await api('notes/show', { noteId: props.renote.id });
				}
				return post(props);
			}
			case 'push':
				if (mainRouter.currentRoute.value.path === ev.data.url) {
					return window.scroll({ top: 0, behavior: 'smooth' });
				}
				return mainRouter.push(ev.data.url);
			default:
				return;
		}
	});
}
