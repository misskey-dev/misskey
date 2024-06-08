/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/*
 * Operations
 * 各種操作
 */
import * as Misskey from 'misskey-js';
import type { SwMessage, SwMessageOrderType } from '@/types.js';
import { getAccountFromId } from '@/scripts/get-account-from-id.js';
import { getUrlWithLoginId } from '@/scripts/login-id.js';

export const cli = new Misskey.api.APIClient({ origin, fetch: (...args): Promise<Response> => fetch(...args) });

export async function api<E extends keyof Misskey.Endpoints, O extends Misskey.Endpoints[E]['req']>(endpoint: E, userId?: string, options?: O): Promise<void | ReturnType<typeof cli.request<E, O>>> {
	let account: { token: string; id: string } | void = undefined;

	if (userId) {
		account = await getAccountFromId(userId);
		if (!account) return;
	}

	return cli.request(endpoint, options, account?.token);
}

// mark-all-as-read送出を1秒間隔に制限する
const readBlockingStatus = new Map<string, boolean>();
export function sendMarkAllAsRead(userId: string): Promise<null | undefined | void> {
	if (readBlockingStatus.get(userId)) return Promise.resolve();
	readBlockingStatus.set(userId, true);
	return new Promise(resolve => {
		setTimeout(() => {
			readBlockingStatus.set(userId, false);
			api('notifications/mark-all-as-read', userId).then(resolve, resolve);
		}, 1000);
	});
}

// rendered acctからユーザーを開く
export function openUser(acct: string, loginId?: string): ReturnType<typeof openClient> {
	return openClient('push', `/@${acct}`, loginId, { acct });
}

// noteIdからノートを開く
export function openNote(noteId: string, loginId?: string): ReturnType<typeof openClient> {
	return openClient('push', `/notes/${noteId}`, loginId, { noteId });
}

// noteIdからノートを開く
export function openAntenna(antennaId: string, loginId: string): ReturnType<typeof openClient> {
	return openClient('push', `/timeline/antenna/${antennaId}`, loginId, { antennaId });
}

// post-formのオプションから投稿フォームを開く
export async function openPost(options: { initialText?: string; reply?: Misskey.entities.Note; renote?: Misskey.entities.Note }, loginId?: string): ReturnType<typeof openClient> {
	// クエリを作成しておく
	const url = '/share';
	const query = new URLSearchParams();
	if (options.initialText) query.set('text', options.initialText);
	if (options.reply) query.set('replyId', options.reply.id);
	if (options.renote) query.set('renoteId', options.renote.id);

	return openClient('post', `${url}?${query}`, loginId, { options });
}

export async function openClient(order: SwMessageOrderType, url: string, loginId?: string, query: Record<string, SwMessage[string]> = {}): Promise<WindowClient | null> {
	const client = await findClient();

	if (client) {
		client.postMessage({ type: 'order', ...query, order, loginId, url } satisfies SwMessage);
		return client;
	}

	return globalThis.clients.openWindow(loginId ? getUrlWithLoginId(url, loginId) : url);
}

export async function findClient(): Promise<WindowClient | null> {
	const clients = await globalThis.clients.matchAll({
		type: 'window',
	});
	return clients.find(c => !(new URL(c.url)).searchParams.has('zen')) ?? null;
}
