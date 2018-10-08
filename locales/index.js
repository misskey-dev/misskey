/**
 * Languages Loader
 */

const fs = require('fs');
const yaml = require('js-yaml');

const langs = ['de-DE', 'en-US', 'fr-FR', 'ja-JP', 'ja-KS', 'pl-PL', 'es-ES', 'nl-NL'];

const loadLocale = lang => yaml.safeLoad(fs.readFileSync(`${__dirname}/${lang}.yml`, 'utf-8'));
const locales = langs.map(lang => ({ [lang]: loadLocale(lang) }));

module.exports = locales.reduce((a, b) => ({ ...a, ...b }));
