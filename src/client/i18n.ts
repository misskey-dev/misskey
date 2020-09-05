import { createI18n } from 'vue-i18n';
import { clientDb, get, count } from './db';
import { setI18nContexts } from './scripts/set-i18n-contexts';
import { version, langs, getLocale } from './config';

let _lang = localStorage.getItem('lang');

if (_lang == null) {
	if (langs.map(x => x[0]).includes(navigator.language)) {
		_lang = navigator.language;
	} else {
		_lang = langs.map(x => x[0]).find(x => x.split('-')[0] == navigator.language);

		if (_lang == null) {
			// Fallback
			_lang = 'en-US';
		}
	}

	localStorage.setItem('lang', _lang);
}

export const lang = _lang;

export const locale = await count(clientDb.i18n).then(async n => {
	if (n === 0) return await setI18nContexts(_lang, version);
	if ((await get('_version_', clientDb.i18n) !== version)) return await setI18nContexts(_lang, version, true);

	return await getLocale();
});

export const i18n = createI18n({
	legacy: true,
	sync: false,
	locale: _lang,
	messages: { [_lang]: locale }
});
