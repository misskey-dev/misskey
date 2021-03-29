/**
 * Service Worker
 */
declare var self: ServiceWorkerGlobalScope;

import { createEmptyNotification, createNotification } from '@client/sw/create-notification';
import { swLang } from '@client/sw/lang';
import { swNotificationRead } from '@client/sw/notification-read';
import { pushNotificationData } from '@/types';
import * as ope from './operations';
import renderAcct from '@/misc/acct/render';

//#region Lifecycle: Install
self.addEventListener('install', ev => {
	ev.waitUntil(self.skipWaiting());
});
//#endregion

//#region Lifecycle: Activate
self.addEventListener('activate', ev => {
	ev.waitUntil(
		caches.keys()
			.then(cacheNames => Promise.all(
				cacheNames
					.filter((v) => v !== swLang.cacheName)
					.map(name => caches.delete(name))
			))
			.then(() => self.clients.claim())
	);
});
//#endregion

//#region When: Fetching
self.addEventListener('fetch', ev => {
	ev.respondWith(
		fetch(ev.request)
		.catch(() => new Response(`Offline. Service Worker @${_VERSION_}`, { status: 200 }))
	);
});
//#endregion

//#region When: Caught Notification
self.addEventListener('push', ev => {
	// クライアント取得
	ev.waitUntil(self.clients.matchAll({
		includeUncontrolled: true,
		type: 'window'
	}).then(async clients => {
		// // クライアントがあったらストリームに接続しているということなので通知しない
		// if (clients.length != 0) return;

		const data: pushNotificationData = ev.data?.json();

		switch (data.type) {
			// case 'driveFileCreated':
			case 'notification':
			case 'unreadMessagingMessage':
				return createNotification(data);

			case 'readAllNotifications':
				for (const n of await self.registration.getNotifications()) {
					if (n.data.type === 'notification') n.close();
				}
				break;
			case 'readAllMessagingMessages':
				for (const n of await self.registration.getNotifications()) {
					if (n.data.type === 'unreadMessagingMessage') n.close();
				}
				break;
			case 'readNotifications':
				for (const n of await self.registration.getNotifications()) {
					if (data.body.notificationIds?.includes(n.data.body.id)) {
						n.close();
					}
				}
				break;
			case 'readAllMessagingMessagesOfARoom':
				for (const n of await self.registration.getNotifications()) {
					if (n.data.type === 'unreadMessagingMessage'
						&& ('userId' in data.body
							? data.body.userId === n.data.body.userId
							: data.body.groupId === n.data.body.groupId)
						) {
							n.close();
						}
				}
				break;
		}

		createEmptyNotification();
		setTimeout(async () => {
			for (const n of 
				[
					...(await self.registration.getNotifications({ tag: 'user_visible_auto_notification' })),
					...(await self.registration.getNotifications({ tag: 'read_notification' }))
				]
			) {
				n.close();
			}
		}, 500);	
	}));
});
//#endregion

//#region Notification
self.addEventListener('notificationclick', ev => {
	ev.waitUntil((async () => {

	if (_DEV_) {
		console.log('notificationclick', ev.action, ev.notification.data);
	}

	const { action, notification } = ev;
	const data: pushNotificationData = notification.data;
	const { type, userId: id, body } = data;
	let client: WindowClient | null = null;
	let close = true;

	switch (action) {
		case 'follow':
			client = await ope.api('following/create', id, { userId: body.userId });
			break;
		case 'showUser':
			client = await ope.openUser(renderAcct(body.user), id);
			if (body.type !== 'renote') close = false;
			break;
		case 'reply':
			client = await ope.openPost({ reply: body.note }, id);
			break;
		case 'renote':
			await ope.api('notes/create', id, { renoteId: body.note.id });
			break;
		case 'accept':
			if (body.type === 'receiveFollowRequest') {
				await ope.api('following/requests/accept', id, { userId: body.userId });
			} else if (body.type === 'groupInvited') {
				await ope.api('users/groups/invitations/accept', id, { invitationId: body.invitation.id });
			}
			break;
		case 'reject':
			if (body.type === 'receiveFollowRequest') {
				await ope.api('following/requests/reject', id, { userId: body.userId });
			} else if (body.type === 'groupInvited') {
				await ope.api('users/groups/invitations/reject', id, { invitationId: body.invitation.id });
			}
			break;
		case 'showFollowRequests':
			client = await ope.openClient('push', '/my/follow-requests', id);
			break;
		default:
			if (type === 'unreadMessagingMessage') {
				client = await ope.openChat(body, id);
				break;
			}

			switch (body.type) {
				case 'receiveFollowRequest':
					client = await ope.openClient('push', '/my/follow-requests', id);
					break;
				case 'groupInvited':
					client = await ope.openClient('push', '/my/groups', id);
					break;
				case 'reaction':
					client = await ope.openNote(body.note.id, id);
					break;
				default:
					if ('note' in body) {
						client = await ope.openNote(body.note.id, id);
						break;
					}
					if ('user' in body) {
						client = await ope.openUser(renderAcct(body.data.user), id);
						break;
					}
			}
	}

	if (client) {
		client.focus();
	}
	if (type === 'notification') {
		swNotificationRead.then(that => that.read(data));
	}
	if (close) {
		notification.close();
	}

	})());
});

self.addEventListener('notificationclose', ev => {
	const data: pushNotificationData = ev.notification.data;

	if (data.type === 'notification') {
		swNotificationRead.then(that => that.read(data));
	}
});
//#endregion

//#region When: Caught a message from the client
self.addEventListener('message', async ev => {
	switch (ev.data) {
		case 'clear':
			// Cache Storage全削除
			await caches.keys()
				.then(cacheNames => Promise.all(
					cacheNames.map(name => caches.delete(name))
				));
			return; // TODO
	}

	if (typeof ev.data === 'object') {
		// E.g. '[object Array]' → 'array'
		const otype = Object.prototype.toString.call(ev.data).slice(8, -1).toLowerCase();

		if (otype === 'object') {
			if (ev.data.msg === 'initialize') {
				swLang.setLang(ev.data.lang);
			}
		}
	}
});
//#endregion
