/**
 * Service Worker
 */
declare var self: ServiceWorkerGlobalScope;

import { get } from 'idb-keyval';
import { swNotification } from '@/sw/notification';
import { swLang } from '@/sw/lang';

//#region Variables
// const cacheName = `mk-cache-${_VERSION_}`;
const apiUrl = `${location.origin}/api/`;
//#endregion

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

// TODO: 消せるかも ref. https://github.com/syuilo/misskey/pull/7108#issuecomment-774573666
//#region When: Fetching
self.addEventListener('fetch', ev => {
	if (ev.request.method !== 'GET' || ev.request.url.startsWith(apiUrl)) return;
	ev.respondWith(
		caches.match(ev.request)
			.then(response => {
				return response || fetch(ev.request);
			})
			.catch(() => new Response('SW cathces error while fetching. You may not be connected to the Internet, or the server may be down.', { status: 200, statusText: 'OK SW' }))
	);
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

		const data = ev.data?.json();

		switch (data.type) {
			case 'notification':
			case 'driveFileCreated':
			case 'unreadMessagingMessage':
				return swNotification.append(data);
			case 'readAllNotifications':
				for (const n of await self.registration.getNotifications()) {
					n.close();
				}
				break;
			case 'readNotifications':
				for (const n of await self.registration.getNotifications()) {
					if (data.notificationIds.includes(n.data.body.id)) n.close();
				}
				break;
		}
	}));
});
//#endregion

//#region Notification
self.addEventListener('notificationclick', ev => {
	const { action, notification } = ev;
	const { data } = notification;
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

self.addEventListener('notificationclose', async ev => {
	const { notification } = ev;
	if (notification.title !== 'notificationclose') {
		self.registration.showNotification('notificationclose', { body: `${notification.data.id}` });
	}
	const { data } = notification;

	if (data.isNotification) {
		const { origin } = location;

		const accounts = await get('accounts');
		const account = accounts.find(i => i.id === data.userId);

		if (!account) return;

		if (data.type === 'notification') {
			fetch(`${origin}/api/notifications/read`, {
				method: 'POST',
				body: JSON.stringify({
					i: account.token,
					notificationIds: [data.body.id]
				})
			});
		}
	}
});
//#endregion

//#region When: Caught a message from the client
self.addEventListener('message', ev => {
	switch(ev.data) {
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
