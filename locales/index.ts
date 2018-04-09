/**
 * Languages Loader
 */

import * as fs from 'fs';
import * as yaml from 'js-yaml';

const loadLang = lang => yaml.safeLoad(
	fs.readFileSync(`./locales/${lang}.yml`, 'utf-8'));

const native = loadLang('ja');

const langs = {
	//'en': loadLang('en'),
	'ja': native
};

Object.entries(langs).map(([, locale]) => {
	// Extend native language (Japanese)
	locale = Object.assign({}, native, locale);
});

export default langs;
