/*
 * Openers
 * クライアントを開く関数。
 * ユーザー、ノート、投稿フォーム、トークルーム
 */
declare var self: ServiceWorkerGlobalScope;

import { SwMessage, swMessageOrderType } from './types';

// acctからユーザーを開く
export async function openUser(acct: string, loginId: string) {
    open('push-user', { acct }, `${origin}/${acct}?loginId=${loginId}`, loginId)
}

// post-formのオプションから投稿フォームを開く
export async function openPost(options: any, loginId: string) {
    // Build share queries from options
    let url = `${origin}/?`;
    if (options.initialText) url += `text=${options.initialText}&`;
    if (options.reply) url += `replyId=${options.reply.id}&`;
    if (options.renote) url += `renoteId=${options.renote.id}&`;
    url += `loginId=${loginId}`;

    open('post', { options }, url, loginId)
}

async function open(order: swMessageOrderType, query: any, url: string, loginId: string) {
    const client = await self.clients.matchAll({
		includeUncontrolled: true,
		type: 'window'
	}).then(clients => clients.length > 0 ? clients[0] : null);

    if (client) {
        client.postMessage({ type: 'order', ...query, order, loginId, url } as SwMessage);

        if ('focus' in client) (client as any).focus();
        return;
    }

    return self.clients.openWindow(url);
}
