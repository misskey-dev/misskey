/**
 * Service Worker
 */

import composeNotification from './common/scripts/compose-notification';
import { erase } from '../../prelude/array';

// キャッシュするリソース
const cachee = [
	'/'
];

// インストールされたとき
self.addEventListener('install', ev => {
	console.info('installed');

	ev.waitUntil(Promise.all([
		self.skipWaiting(), // Force activate
		caches.open(_VERSION_).then(cache => cache.addAll(cachee)) // Cache
	]));
});

// アクティベートされたとき
self.addEventListener('activate', ev => {
	// Clean up old caches
	ev.waitUntil(
		caches.keys().then(keys => Promise.all(
			erase(_VERSION_, keys)
				.map(key => caches.delete(key))
		))
	);
});

// リクエストが発生したとき
self.addEventListener('fetch', ev => {
	ev.respondWith(
		// キャッシュがあるか確認してあればそれを返す
		caches.match(ev.request).then(response =>
			response || fetch(ev.request)
		)
	);
});

// プッシュ通知を受け取ったとき
self.addEventListener('push', ev => {
	// クライアント取得
	ev.waitUntil(self.clients.matchAll({
		includeUncontrolled: true
	}).then(clients => {
		// クライアントがあったらストリームに接続しているということなので通知しない
		if (clients.length != 0) return;

		const { type, body } = ev.data.json();

		const n = composeNotification(type, body);
		return self.registration.showNotification(n.title, {
			body: n.body,
			icon: n.icon,
		});
	}));
});

self.addEventListener('message', ev => {
	if (ev.data == 'clear') {
		caches.keys().then(keys => {
			for (const key of keys) caches.delete(key);
		});
	}
});
