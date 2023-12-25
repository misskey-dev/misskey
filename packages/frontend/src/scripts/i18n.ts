/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class I18n<T extends Record<string, any>> {
	public ts: T;

	constructor(locale: T) {
		this.ts = locale;

		//#region BIND
		this.t = this.t.bind(this);
		//#endregion
	}

	// string にしているのは、ドット区切りでのパス指定を許可するため
	// なるべくこのメソッド使うよりもlocale直接参照の方がvueのキャッシュ効いてパフォーマンスが良いかも
	public t(key: string, args?: Record<string, string | number>): string {
		try {
			let str = key.split('.').reduce((o, i) => o[i], this.ts) as unknown as string;

			if (args) {
				for (const [k, v] of Object.entries(args)) {
					str = str.replace(`{${k}}`, v.toString());
				}
			}
			return str;
		} catch (err) {
			console.warn(`missing localization '${key}'`);
			return key;
		}
	}
}
