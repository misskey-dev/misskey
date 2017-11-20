/**
 * Service Worker
 */

import composeNotification from './common/scripts/compose-notification';

// インストールされたとき
self.addEventListener('install', () => {
	console.log('[sw]', 'Your ServiceWorker is installed');
});

// プッシュ通知を受け取ったとき
self.addEventListener('push', ev => {
	// クライアント取得
	self.clients.matchAll({
		includeUncontrolled: true
	}).then(clients => {
		// クライアントがあったらストリームに接続しているということなので通知しない
		if (clients.length != 0) return;

		const { type, body } = ev.data.json();
		const n = composeNotification(type, body);
		if (n) {
			self.registration.showNotification(n.title, {
				body: n.body,
				icon: n.icon,
			});
		}
	});
});
