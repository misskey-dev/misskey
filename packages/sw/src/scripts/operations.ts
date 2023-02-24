/*
 * Operations
 * 各種操作
 */
import * as Misskey from 'misskey-js';
import { SwMessage, swMessageOrderType } from '@/types';
import { acct as getAcct } from '@/filters/user';
import { getAccountFromId } from '@/scripts/get-account-from-id';
import { getUrlWithLoginId } from '@/scripts/login-id';

export const cli = new Misskey.api.APIClient({ origin, fetch: (...args) => fetch(...args) });

export async function api<E extends keyof Misskey.Endpoints>(endpoint: E, userId: string, options?: Misskey.Endpoints[E]['req']) {
	const account = await getAccountFromId(userId);
	if (!account) return;

	return cli.request(endpoint, options, account.token);
}

// rendered acctからユーザーを開く
export function openUser(acct: string, loginId: string) {
	return openClient('push', `/@${acct}`, loginId, { acct });
}

// noteIdからノートを開く
export function openNote(noteId: string, loginId: string) {
	return openClient('push', `/notes/${noteId}`, loginId, { noteId });
}

// noteIdからノートを開く
export function openAntenna(antennaId: string, loginId: string) {
	return openClient('push', `/timeline/antenna/${antennaId}`, loginId, { antennaId });
}

// post-formのオプションから投稿フォームを開く
export async function openPost(options: any, loginId: string) {
	// クエリを作成しておく
	let url = '/share?';
	if (options.initialText) url += `text=${options.initialText}&`;
	if (options.reply) url += `replyId=${options.reply.id}&`;
	if (options.renote) url += `renoteId=${options.renote.id}&`;

	return openClient('post', url, loginId, { options });
}

export async function openClient(order: swMessageOrderType, url: string, loginId: string, query: any = {}) {
	const client = await findClient();

	if (client) {
		client.postMessage({ type: 'order', ...query, order, loginId, url } as SwMessage);
		return client;
	}

	return globalThis.clients.openWindow(getUrlWithLoginId(url, loginId));
}

export async function findClient() {
	const clients = await globalThis.clients.matchAll({
		type: 'window',
	});
	for (const c of clients) {
		if (c.url.indexOf('?zen') < 0) return c;
	}
	return null;
}
