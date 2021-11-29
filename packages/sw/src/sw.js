self.importScripts('/sw-lib.VERSION.js');

self.addEventListener('install', self.lib.oninstall);

self.addEventListener('activate', self.lib.onactivate);

self.addEventListener('fetch', self.lib.onfetch);

self.addEventListener('push', self.lib.onpush);

self.addEventListener('notificationclick', self.lib.onnotificationclick);

self.addEventListener('notificationclose', self.lib.onnotificationclose);

self.addEventListener('message', self.lib.onmessage);
