/**
 * Service Worker
 */
declare var self: ServiceWorkerGlobalScope;

import { createNotification } from '@/sw/create-notification';
import { swLang } from '@/sw/lang';
import { swNotificationRead } from '@/sw/notification-read';
import { pushNotificationData } from '../../types';

//#region Lifecycle: Install
self.addEventListener('install', ev => {
	// Nothing to do
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
	// Nothing to do
});
//#endregion

//#region When: Caught Notification
self.addEventListener('push', ev => {
	// クライアント取得
	ev.waitUntil(self.clients.matchAll({
		includeUncontrolled: true
	}).then(async clients => {
		// // クライアントがあったらストリームに接続しているということなので通知しない
		// if (clients.length != 0) return;

		const data: pushNotificationData = ev.data?.json();

		console.log('push', data)

		switch (data.type) {
			// case 'driveFileCreated':
			case 'notification':
			case 'unreadMessagingMessage':
				return createNotification(data);
			case 'readAllNotifications':
				for (const n of await self.registration.getNotifications()) {
					n.close();
				}
				break;
			case 'readNotifications':
				for (const notification of await self.registration.getNotifications()) {
					if (data.body.notificationIds.includes(notification.data.body.id)) {
						notification.close();
					}
				}
				break;
		}
	}));
});
//#endregion

//#region Notification
self.addEventListener('notificationclick', ev => {
	const { action, notification } = ev;
	console.log('click', action, notification)
	const data: pushNotificationData = notification.data;
	const { origin } = location;

	const suffix = `?loginId=${data.userId}`;

	switch (action) {
		case 'showUser':
			switch (data.body.type) {
				case 'reaction':
					self.clients.openWindow(`${origin}/users/${data.body.user.id}${suffix}`);
					break;

				default:
					if ('note' in data.body) {
						self.clients.openWindow(`${origin}/users/${data.body.note.user.id}${suffix}`);
					}
			}
			break;
		default:
	}

	notification.close();
});

self.addEventListener('notificationclose', ev => {
	const { notification } = ev;

	console.log('close', notification)

	if (notification.title !== 'notificationclose') {
		self.registration.showNotification('notificationclose', { body: `${notification?.data?.body?.id}` });
	}
	const data: pushNotificationData = notification.data;

	if (data.type === 'notification') {
		console.log('close', data);
		swNotificationRead.then(that => that.read(data));
	}
});
//#endregion

//#region When: Caught a message from the client
self.addEventListener('message', ev => {
	switch (ev.data) {
		case 'clear':
			return; // TODO
		default:
			break;
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
