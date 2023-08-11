export type Locale = { [key: string]: string | Locale };

export class I18n<T extends Locale = Locale> {
	public ts: T;

	constructor(locale: T) {
		this.ts = locale;

		//#region BIND
		this.t = this.t.bind(this);
		//#endregion
	}

	// string にしているのは、ドット区切りでのパス指定を許可するため
	// なるべくこのメソッド使うよりもlocale直接参照の方がvueのキャッシュ効いてパフォーマンスが良いかも
	public t(key: string, args?: Record<string, string>): string {
		try {
			let str = key.split('.').reduce<Locale | Locale[keyof Locale]>((o, i) => o[i], this.ts);
			if (typeof str !== 'string') throw new Error();

			if (args) {
				for (const [k, v] of Object.entries(args)) {
					str = str.replace(`{${k}}`, v);
				}
			}
			return str;
		} catch (err) {
			console.warn(`missing localization '${key}'`);
			return key;
		}
	}
}
