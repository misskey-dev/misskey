/**
 * Replace i18n texts
 */

import locale from '../../locales';

export default class Replacer {
	private lang: string;

	public pattern = /%i18n:(.+?)%/g;

	constructor(lang: string) {
		this.lang = lang;

		this.get = this.get.bind(this);
		this.replacement = this.replacement.bind(this);
	}

	private get(path: string, key: string) {
		const texts = locale[this.lang];

		if (texts == null) {
			console.warn(`lang '${this.lang}' is not supported`);
			return key; // Fallback
		}

		let text = texts;

		if (path) {
			if (text.hasOwnProperty(path)) {
				text = text[path];
			} else {
				console.warn(`path '${path}' not found in '${this.lang}'`);
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
			console.warn(`key '${key}' not found in '${path}' of '${this.lang}'`);
			return key; // Fallback
		} else {
			return text;
		}
	}

	public replacement(ctx, match, a, b, c) {
		const client = 'misskey/src/client/app/';
		let name = null;

		let key = a || b || c;
		if (key[0] == '@') {
			name = ctx.src.substr(ctx.src.indexOf(client) + client.length);
			key = key.substr(1);
		}

		if (ctx && ctx.lang) this.lang = ctx.lang;

		return this.get(name, key).replace(/'/g, '\\x27').replace(/"/g, '\\x22');
	}
}
