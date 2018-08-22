/**
 * Languages Loader
 */

const fs = require('fs');
const yaml = require('js-yaml');

const loadLang = lang => yaml.safeLoad(
	fs.readFileSync(`${__dirname}/${lang}.yml`, 'utf-8'));

const native = loadLang('ja-JP');

const langs = {
	'de-DE': loadLang('de-DE'),
	'en-US': loadLang('en-US'),
	'fr-FR': loadLang('fr-FR'),
	'ja-JP': native,
	'ja-KS': loadLang('ja-KS'),
	'pl-PL': loadLang('pl-PL'),
	'es-ES': loadLang('es-ES')
};

Object.values(langs).forEach(locale => {
	// Extend native language (Japanese)
	locale = Object.assign({}, native, locale);
});

module.exports = langs;
