/**
 * Service Worker
 */

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
		handlers[type](body);
	});
});

const handlers = {
	mention: body => {
		self.registration.showNotification('mentioned', {
			body: body.text,
			icon: body.user.avatar_url + '?thumbnail&size=64',
		});
	}
};
