import { createEmptyNotification, createNotification } from '@/scripts/create-notification';
import { swLang } from '@/scripts/lang';
import { swNotificationRead } from '@/scripts/notification-read';
import { pushNotificationDataMap } from '@/types';
import * as swos from '@/scripts/operations';
import { acct as getAcct } from '@/filters/user';

globalThis.addEventListener('install', ev => {
	//ev.waitUntil(globalThis.skipWaiting());
});

globalThis.addEventListener('activate', ev => {
	ev.waitUntil(
		caches.keys()
			.then(cacheNames => Promise.all(
				cacheNames
					.filter((v) => v !== swLang.cacheName)
					.map(name => caches.delete(name)),
			))
			.then(() => globalThis.clients.claim()),
	);
});

globalThis.addEventListener('fetch', ev => {
	let isHTMLRequest = false;
	if (ev.request.headers.get('sec-fetch-dest') === 'document') {
		isHTMLRequest = true;
	} else if (ev.request.headers.get('accept')?.includes('/html')) {
		isHTMLRequest = true;
	} else if (ev.request.url.endsWith('/')) {
		isHTMLRequest = true;
	}

	if (!isHTMLRequest) return;
	ev.respondWith(
		fetch(ev.request)
			.catch(() => new Response(`Offline. Service Worker @${_VERSION_}`, { status: 200 })),
	);
});

globalThis.addEventListener('push', ev => {
	// クライアント取得
	ev.waitUntil(globalThis.clients.matchAll({
		includeUncontrolled: true,
		type: 'window',
	}).then(async (clients: readonly WindowClient[]) => {
		const data: pushNotificationDataMap[keyof pushNotificationDataMap] = ev.data?.json();

		switch (data.type) {
			// case 'driveFileCreated':
			case 'notification':
			case 'unreadAntennaNote':
				// 1日以上経過している場合は無視
				if ((new Date()).getTime() - data.dateTime > 1000 * 60 * 60 * 24) break;

				return createNotification(data);
			case 'readAllNotifications':
				for (const n of await globalThis.registration.getNotifications()) {
					if (n?.data?.type === 'notification') n.close();
				}
				break;
			case 'readAllAntennas':
				for (const n of await globalThis.registration.getNotifications()) {
					if (n?.data?.type === 'unreadAntennaNote') n.close();
				}
				break;
			case 'readNotifications':
				for (const n of await globalThis.registration.getNotifications()) {
					if (data.body.notificationIds.includes(n.data.body.id)) {
						n.close();
					}
				}
				break;
			case 'readAntenna':
				for (const n of await globalThis.registration.getNotifications()) {
					if (n?.data?.type === 'unreadAntennaNote' && data.body.antennaId === n.data.body.antenna.id) {
						n.close();
					}
				}
				break;
		}

		await createEmptyNotification();
		return;
	}));
});

globalThis.addEventListener('notificationclick', (ev: ServiceWorkerGlobalScopeEventMap['notificationclick']) => {
	ev.waitUntil((async () => {
		if (_DEV_) {
			console.log('notificationclick', ev.action, ev.notification.data);
		}

		const { action, notification } = ev;
		const data: pushNotificationDataMap[keyof pushNotificationDataMap] = notification.data;
		const { userId: loginId } = data;
		let client: WindowClient | null = null;

		switch (data.type) {
			case 'notification':
				switch (action) {
					case 'follow':
						if ('userId' in data.body) await swos.api('following/create', loginId, { userId: data.body.userId });
						break;
					case 'showUser':
						if ('user' in data.body) client = await swos.openUser(getAcct(data.body.user), loginId);
						break;
					case 'reply':
						if ('note' in data.body) client = await swos.openPost({ reply: data.body.note }, loginId);
						break;
					case 'renote':
						if ('note' in data.body) await swos.api('notes/create', loginId, { renoteId: data.body.note.id });
						break;
					case 'accept':
						switch (data.body.type) {
							case 'receiveFollowRequest':
								await swos.api('following/requests/accept', loginId, { userId: data.body.userId });
								break;
						}
						break;
					case 'reject':
						switch (data.body.type) {
							case 'receiveFollowRequest':
								await swos.api('following/requests/reject', loginId, { userId: data.body.userId });
								break;
						}
						break;
					case 'showFollowRequests':
						client = await swos.openClient('push', '/my/follow-requests', loginId);
						break;
					default:
						switch (data.body.type) {
							case 'receiveFollowRequest':
								client = await swos.openClient('push', '/my/follow-requests', loginId);
								break;
							case 'reaction':
								client = await swos.openNote(data.body.note.id, loginId);
								break;
							default:
								if ('note' in data.body) {
									client = await swos.openNote(data.body.note.id, loginId);
								} else if ('user' in data.body) {
									client = await swos.openUser(getAcct(data.body.user), loginId);
								}
								break;
						}
				}
				break;
			case 'unreadAntennaNote':
				client = await swos.openAntenna(data.body.antenna.id, loginId);
		}

		if (client) {
			client.focus();
		}
		if (data.type === 'notification') {
			swNotificationRead.then(that => that.read(data));
		}

		notification.close();
	})());
});

globalThis.addEventListener('notificationclose', (ev: ServiceWorkerGlobalScopeEventMap['notificationclose']) => {
	const data: pushNotificationDataMap[keyof pushNotificationDataMap] = ev.notification.data;

	if (data.type === 'notification') {
		swNotificationRead.then(that => that.read(data));
	}
});

globalThis.addEventListener('message', (ev: ServiceWorkerGlobalScopeEventMap['message']) => {
	ev.waitUntil((async () => {
		switch (ev.data) {
			case 'clear':
				// Cache Storage全削除
				await caches.keys()
					.then(cacheNames => Promise.all(
						cacheNames.map(name => caches.delete(name)),
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
	})());
});
