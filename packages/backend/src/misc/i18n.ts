/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class I18n<T extends Record<string, any>> {
	public locale: T;

	constructor(locale: T) {
		this.locale = locale;

		//#region BIND
		//this.t = this.t.bind(this);
		//#endregion
	}

	// string にしているのは、ドット区切りでのパス指定を許可するため
	// なるべくこのメソッド使うよりもlocale直接参照の方がvueのキャッシュ効いてパフォーマンスが良いかも
	public t(key: string, args?: Record<string, any>): string {
		try {
			let str = key.split('.').reduce((o, i) => o[i], this.locale as any) as string;

			if (args) {
				for (const [k, v] of Object.entries(args)) {
					str = str.replace(`{${k}}`, v);
				}
			}
			return str;
		} catch (e) {
			console.warn(`missing localization '${key}'`);
			return key;
		}
	}
}
