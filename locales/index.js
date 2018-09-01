/**
 * Languages Loader
 */

const fs = require('fs');
const yaml = require('js-yaml');

const langs = ['de-DE', 'en-US', 'fr-FR', 'ja-JP', 'ja-KS', 'pl-PL', 'es-ES'];
const nativeLang = 'ja-JP';

const loadLocale = lang => yaml.safeLoad(fs.readFileSync(`${__dirname}/${lang}.yml`, 'utf-8'));
const nativeLocale = loadLocale(nativeLang);
const fallbackToNativeLocale = locale => Object.assign({}, nativeLocale, locale);
const makeLocale = lang => lang == nativeLang ? nativeLocale : fallbackToNativeLocale(loadLocale(lang));
const locales = langs.map(lang => ({ [lang]: makeLocale(lang) }));

module.exports = locales.reduce((a, b) => ({ ...a, ...b }));
