/**
 * Service Worker
 */

import composeNotification from './common/scripts/compose-notification';

// インストールされたとき
self.addEventListener('install', () => {
	console.info('installed');
});

// プッシュ通知を受け取ったとき
self.addEventListener('push', ev => {
	console.log('pushed');

	// クライアント取得
	ev.waitUntil(self.clients.matchAll({
		includeUncontrolled: true
	}).then(clients => {
		// クライアントがあったらストリームに接続しているということなので通知しない
		if (clients.length != 0) return;

		const { type, body } = ev.data.json();

		console.log(type, body);

		const n = composeNotification(type, body);
		return self.registration.showNotification(n.title, {
			body: n.body,
			icon: n.icon,
		});
	}));
});
