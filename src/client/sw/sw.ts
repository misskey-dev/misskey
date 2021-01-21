/**
 * Service Worker
 */
declare var self: ServiceWorkerGlobalScope;

import composeNotification from '@/sw/compose-notification';
import { I18n } from '@/scripts/i18n';

export let i18n: I18n<any>;

let i: string;

const version = _VERSION_;
const cacheName = `mk-cache-${version}`;

const apiUrl = `${location.origin}/api/`;

// インストールされたとき
self.addEventListener('install', ev => {
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
		if (clients.length != 0) return;

		const { type, body } = ev.data?.json();

		const n = await composeNotification(type, body, i18n);
		if (n) return self.registration.showNotification(...n);
	}));
});

// クライアントのpostMessageを処理します
self.addEventListener('message', ev => {
	switch(ev.data) {
		case 'clear':
			return; // TODO
		default:
			break;
	}

	if (typeof ev.data === 'object') {
		const otype = Object.prototype.toString.call(ev.data).slice(8, -1).toLowerCase();

		if (otype === 'object') {
			if (ev.data.msg === 'initialize') {
				console.log('initialize')
				i = ev.data.$i;
				i18n = new I18n(ev.data.locale);
			}
		}
	}
});
