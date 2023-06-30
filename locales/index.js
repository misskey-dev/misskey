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
	'en-US',
	'ja-JP',
	'ja-KS'
];

const primaries = {
	'en': 'US',
	'ja': 'JP'
};

// 何故か文字列にバックスペース文字が混入することがあり、YAMLが壊れるので取り除く
const clean = (text) => text.replace(new RegExp(String.fromCodePoint(0x08), 'g'), '');

const locales = languages.reduce((a, c) => (a[c] = yaml.load(clean(fs.readFileSync(`${__dirname}/${c}.yml`, 'utf-8'))) || {}, a), {});

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
