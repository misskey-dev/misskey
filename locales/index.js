/**
 * Languages Loader
 */

const fs = require('fs');
const yaml = require('js-yaml');

const merge = (...args) => args.reduce((a, c) => ({
	...a,
	...c,
	...Object.entries(a)
		.filter(([k]) => c && typeof c[k] === 'object')
		.reduce((a, [k, v]) => (a[k] = merge(v, c[k]), a), {})
}), {});

const languages = [
	//'cs-CZ',
	//'da-DK',
	//'de-DE',
	'en-US',
	'es-ES',
	'fr-FR',
	'ja-JP',
	'ja-KS',
	'ko-KR',
	//'nl-NL',
	//'pl-PL',
	'zh-CN',
	//'zh-TW',
];

const primaries = {
	'en': 'US',
	'ja': 'JP',
	'zh': 'CN',
};

const locales = languages.reduce((a, c) => (a[c] = yaml.safeLoad(fs.readFileSync(`${__dirname}/${c}.yml`, 'utf-8')) || {}, a), {});

module.exports = Object.entries(locales)
	.reduce((a, [k ,v]) => (a[k] = (() => {
		const [lang] = k.split('-');
		switch (k) {
			case 'ja-JP': return v;
			case 'ja-KS':
			case 'en-US': return merge(locales['ja-JP'], v);
			default: return merge(
				locales['ja-JP'],
				locales['en-US'],
				locales[`${lang}-${primaries[lang]}`] || {},
				v
			);
		}
	})(), a), {});
