/*
 * Language manager for SW
 */
declare var self: ServiceWorkerGlobalScope;

import { get, set } from 'idb-keyval';
import { I18n } from '@/scripts/i18n';

class SwLang {
	public cacheName = `mk-cache-${_VERSION_}`;

	public lang: Promise<string> = get('lang').then(async prelang => {
		if (!prelang) return 'en-US';
		return prelang;
	});

	public i18n: Promise<I18n<any>> | null = null;

	public setLang(newLang: string) {
		this.lang = Promise.resolve(newLang);
		set('lang', newLang);
		return this.fetchLocale();
	}

	public async fetchLocale() {
		// Service Workerは何度も起動しそのたびにlocaleを読み込むので、CacheStorageを使う
		return this.i18n = new Promise(async (res, rej) => {
			const localeUrl = `/assets/locales/${await this.lang}.${_VERSION_}.json`;
			let localeRes = await caches.match(localeUrl);
	
			if (!localeRes) {
				localeRes = await fetch(localeUrl);
				const clone = localeRes?.clone();
				if (!clone?.clone().ok) rej('locale fetching error');

				caches.open(this.cacheName).then(cache => cache.put(localeUrl, clone));
			}

			res(new I18n(await localeRes.json()));
		});
	}
}

export const swLang = new SwLang();
