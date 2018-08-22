/**
 * Replace i18n texts
 */

const locale = require('../../locales');

export default class Replacer {
	private lang: string;

	public pattern = /%i18n:([a-z0-9_\-\.\/\|]+?)%/g;

	constructor(lang: string) {
		this.lang = lang;

		this.get = this.get.bind(this);
		this.replacement = this.replacement.bind(this);
	}

	public get(path: string, key: string): string {
		if (!(this.lang in locale)) {
			console.warn(`lang '${this.lang}' is not supported`);
			return key; // Fallback
		}

		const texts = locale[this.lang];

		let text = texts;

		if (path) {
			path = path.replace('.ts', '');

			if (text.hasOwnProperty(path)) {
				text = text[path];
			} else {
				if (this.lang === 'ja-JP') console.warn(`path '${path}' not found`);
				return key; // Fallback
			}
		}

		// Check the key existance
		const error = key.split('.').some(k => {
			if (text.hasOwnProperty(k)) {
				text = text[k];
				return false;
			} else {
				return true;
			}
		});

		if (error) {
			if (this.lang === 'ja-JP') console.warn(`key '${key}' not found in '${path}'`);
			return key; // Fallback
		} else if (typeof text !== 'string') {
			if (this.lang === 'ja-JP') console.warn(`key '${key}' is not string in '${path}'`);
			return key; // Fallback
		} else {
			return text;
		}
	}

	public replacement(match: string, key: string) {
		let path = null;

		if (key.indexOf('|') != -1) {
			path = key.split('|')[0];
			key = key.split('|')[1];
		}

		const txt = this.get(path, key);

		return txt.replace(/'/g, '\\x27').replace(/"/g, '\\x22');
	}
}
