/**
 * Languages Loader
 */

const fs = require('fs');
const yaml = require('js-yaml');

const loadLang = lang => yaml.safeLoad(
	fs.readFileSync(`${__dirname}/${lang}.yml`, 'utf-8'));

const native = loadLang('ja-JP');

const langs = {
	'de': loadLang('de'),
	'en': loadLang('en'),
	'fr': loadLang('fr'),
	'ja': native,
	'ja-ks': loadLang('ja-ks'),
	'pl': loadLang('pl'),
	'es': loadLang('es')
};

Object.values(langs).forEach(locale => {
	// Extend native language (Japanese)
	locale = Object.assign({}, native, locale);
});

module.exports = langs;
