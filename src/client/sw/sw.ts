/**
 * Service Worker
 */
declare var self: ServiceWorkerGlobalScope;

import { get, set } from 'idb-keyval';
import composeNotification from '@/sw/compose-notification';
import { I18n } from '@/scripts/i18n';

//#region Variables
const version = _VERSION_;
const cacheName = `mk-cache-${version}`;
const apiUrl = `${location.origin}/api/`;

let lang: Promise<string> = get('lang').then(async prelang => {
	if (!prelang) return 'en-US';
	return prelang;
});
let i18n: I18n<any>;
let pushesPool: any[] = [];
//#endregion

//#region Function: (Re)Load i18n instance
async function fetchLocale() {
	//#region localeファイルの読み込み
	// Service Workerは何度も起動しそのたびにlocaleを読み込むので、CacheStorageを使う
	const localeUrl = `/assets/locales/${await lang}.${version}.json`;
	let localeRes = await caches.match(localeUrl);

	if (!localeRes) {
		localeRes = await fetch(localeUrl);
		const clone = localeRes?.clone();
		if (!clone?.clone().ok) return;

		caches.open(cacheName).then(cache => cache.put(localeUrl, clone));
	}

	i18n = new I18n(await localeRes.json());
	//#endregion

	//#region i18nをきちんと読み込んだ後にやりたい処理
	for (const data of pushesPool) {
		const n = await composeNotification(data, i18n);
		if (n) self.registration.showNotification(...n);
	}
	pushesPool = [];
	//#endregion
}
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
					.filter((v) => v !== cacheName)
					.map(name => caches.delete(name))
			))
			.then(() => self.clients.claim())
	);
});
//#endregion

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

		// localeを読み込めておらずi18nがundefinedだった場合はpushesPoolにためておく
		if (!i18n) return pushesPool.push(data);

		const n = await composeNotification(data, i18n);
		if (n) return self.registration.showNotification(...n);
	}));
});
//#endregion

//#region Notification
self.addEventListener('notificationclick', ev => {
	const { action, notification } = ev;
	const { data } = notification;
	const { origin } = location;

	switch (action) {
		case 'showUser':
			switch (data.body.type) {
				case 'reaction':
					self.clients.openWindow(`${origin}/users/${data.body.user.id}`);
					break;

				default:
					if ('note' in data.body) {
						self.clients.openWindow(`${origin}/notes/${data.body.note.id}`);
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
	const { data } = notification;

	if (data.isNotification) {
		const { origin } = location;

		const accounts = await get('accounts');
		const account = accounts.find(i => i.id === data.userId);

		if (!account) return;

		fetch(`${origin}/api/notifications/read`, {
			method: 'POST',
			body: JSON.stringify({
				i: account.token,
				notificationIds: [data.data.id]
			})
		});
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
				lang = Promise.resolve(ev.data.lang);
				set('lang', ev.data.lang);
				fetchLocale();
			}
		}
	}
});
//#endregion
