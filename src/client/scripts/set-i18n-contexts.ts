import VueI18n from 'vue-i18n';
import { clientDb, clear, bulkSet } from '../db';
import { deepEntries, delimitEntry } from 'deep-entries';
import { fromEntries } from '../../prelude/array';

export function setI18nContexts(lang: string, version: string, i18n: VueI18n, cleardb = false) {
	return Promise.all([
		cleardb ? clear(clientDb.i18n) : Promise.resolve(),
		fetch(`/assets/locales/${lang}.${version}.json`)
	])
	.then(([, response]) => response.json())
	.then(locale => {
		const flatLocaleEntries = deepEntries(locale, delimitEntry) as [string, string][];
		bulkSet(flatLocaleEntries, clientDb.i18n);
		i18n.locale = lang;
		i18n.setLocaleMessage(lang, fromEntries(flatLocaleEntries));
	});
}
