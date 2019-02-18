/**
 * Languages Loader
 */

const fs = require('fs');
const yaml = require('js-yaml');

const langs = ['de-DE', 'en-US', 'fr-FR', 'ja-JP', 'ja-KS', 'pl-PL', 'es-ES', 'nl-NL', 'zh-CN', 'ko-KR'];

const loadLocale = lang => yaml.safeLoad(fs.readFileSync(`${__dirname}/${lang}.yml`, 'utf-8'));
const locales = langs
	.map(lang => [lang, loadLocale(lang)])
	.map(([lang, locale], _, locales) => {
		switch (lang) {
			case 'ja-JP': return [lang, locale];
			case 'en-US': return [lang, { ...locales['ja-JP'], ...locale }];
			default: return [lang, {
				...(lang.startsWith('ja-') ? {} : locales['en-US']),
				...locales['ja-JP'],
				...locale
		}];
		}
	})
	.map(([lang, locale]) => ({ [lang]: loadLocale(lang) }));

module.exports = locales.reduce((a, b) => ({ ...a, ...b }));
