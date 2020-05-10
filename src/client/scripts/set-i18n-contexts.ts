import { clientDb, clear, bulkSet } from '../db';
import i18n from '../i18n';
import { deepEntries, delimitEntry } from 'deep-entries';
import { fromEntries } from '../../prelude/array';

export function setI18nContexts(lang: string, version: string, cleardb = false) {
	return Promise.all([
		cleardb ? clear(clientDb.i18nContexts) : Promise.resolve(),
		fetch(`/assets/locales/${lang}.${version}.json`)
	])
	.then(([, response]) => response.json())
	.then(locale => {
		const flatLocaleEntries = deepEntries(locale, delimitEntry) as [string, string][];
		bulkSet(flatLocaleEntries, clientDb.i18nContexts);
		i18n.locale = lang;
		i18n.setLocaleMessage(lang, fromEntries(flatLocaleEntries));
	});
}
