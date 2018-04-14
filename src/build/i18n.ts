/**
 * Replace i18n texts
 */

import locale from '../../locales';

export default class Replacer {
	private lang: string;

	public pattern = /"%i18n:(.+?)%"|'%i18n:(.+?)%'|%i18n:(.+?)%/g;

	constructor(lang: string) {
		this.lang = lang;

		this.get = this.get.bind(this);
		this.replacement = this.replacement.bind(this);
	}

	private get(key: string) {
		const texts = locale[this.lang];

		if (texts == null) {
			console.warn(`lang '${this.lang}' is not supported`);
			return key; // Fallback
		}

		let text = texts;

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
			console.warn(`key '${key}' not found in '${this.lang}'`);
			return key; // Fallback
		} else {
			return text;
		}
	}

	public replacement(ctx, match, a, b, c) {
		const client = 'misskey/src/client/app/';
		const name = ctx.src.substr(ctx.src.indexOf(client) + client.length);
		if (name == '') return match;

		let key = a || b || c;
		if (key[0] == '@') {
			const prefix = name.split('.')[0].replace(/\//g, '.') + '.';
			//if (name.startsWith('app/desktop/views/')) prefix = 'desktop.views.';
			//if (name.startsWith('app/mobile/views/')) prefix = 'mobile.views.';
			key = prefix + key.substr(1);
		}

		if (match[0] == '"') {
			return '"' + this.get(key).replace(/"/g, '\\"') + '"';
		} else if (match[0] == "'") {
			return '\'' + this.get(key).replace(/'/g, '\\\'') + '\'';
		} else {
			return this.get(key);
		}
	}
}
