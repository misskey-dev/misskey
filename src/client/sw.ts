/**
 * Service Worker
 */
declare var self: ServiceWorkerGlobalScope;

import composeNotification from './scripts/compose-notification';
import { VuexPersistDB } from './scripts/vuex-idb';

// eslint-disable-next-line no-undef
const version = _VERSION_;
const cacheName = `mk-cache-${version}`;

const apiUrl = `${location.origin}/api/`;

// インストールされたとき
self.addEventListener('install', ev => {
	console.info('installed');

	ev.waitUntil(
		caches.open(cacheName)
			.then(cache => {
				return cache.addAll([
					`/?v=${version}`
				]);
			})
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', ev => {
	ev.waitUntil(
		caches.keys()
			.then(cacheNames => Promise.all(
				cacheNames
					.filter((v) => v !== cacheName)
					.map(name => caches.delete(name))
			))
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', ev => {
	if (ev.request.method !== 'GET' || ev.request.url.startsWith(apiUrl)) return;
	ev.respondWith(
		caches.match(ev.request)
			.then(response => {
				return response || fetch(ev.request);
			})
			.catch(() => {
				return caches.match(`/?v=${version}`);
			})
	);
});

// プッシュ通知を受け取ったとき
self.addEventListener('push', ev => {
	// クライアント取得
	ev.waitUntil(self.clients.matchAll({
		includeUncontrolled: true
	}).then(async clients => {
		// クライアントがあったらストリームに接続しているということなので通知しない
		// if (clients.length != 0) return;

		const { type, body } = ev.data.json();

		return self.registration.showNotification(...(await composeNotification(type, body)));
	}));
});

self.addEventListener('notificationclick', ev => {
	const { action, notification } = ev;
	const type = notification.data.type;
	const push = notification.data.data;
	const { origin } = location;

	switch (action) {
		case 'showUser':
			switch (type) {
				case 'reaction':
					self.clients.openWindow(`${origin}/users/${push.user.id}`);
					break;

				default:
					if ('note' in push) {
						self.clients.openWindow(`${origin}/notes/${push.note.id}`);
					}
			}
			break;
		default:
	}

	notification.close();
});

self.addEventListener('notificationclose', async ev => {
	self.registration.showNotification('notificationclose');
	const { notification } = ev;
	const { data } = notification

	if (data.isNotification) {
		const { origin } = location;

		const db = new VuexPersistDB();

		const i = await db.get('i', 'store')

		fetch(`${origin}/api/notifications/read`, {
			method: 'POST',
			body: JSON.stringify({
				i,
				notificationIds: [data.data.id]
			})
		});
	}
});
