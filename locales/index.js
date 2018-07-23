/**
 * Languages Loader
 */

const fs = require('fs');
const yaml = require('js-yaml');

const loadLang = lang => yaml.safeLoad(
	fs.readFileSync(`${__dirname}/${lang}.yml`, 'utf-8'));

const native = loadLang('ja');

const langs = {
	'de': loadLang('de'),
	'en': loadLang('en'),
	'fr': loadLang('fr'),
	'ja': native,
	'pl': loadLang('pl'),
	'es': loadLang('es')
};

Object.values(langs).forEach(locale => {
	// Extend native language (Japanese)
	Object.assign(locale, native);
});

module.exports = langs;
