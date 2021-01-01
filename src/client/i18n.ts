import { markRaw } from 'vue';
import { locale } from '@/config';

export class I18n<T extends Record<string, any>> {
	public locale: T;

	constructor(locale: T) {
		this.locale = locale;

		if (_DEV_) {
			console.log('i18n', this.locale);
		}

		//#region BIND
		this.t = this.t.bind(this);
		//#endregion
	}

	// string にしているのは、ドット区切りでのパス指定を許可するため
	// なるべくこのメソッド使うよりもlocale直接参照の方がvueのキャッシュ効いてパフォーマンスが良いかも
	public t(key: string, args?: Record<string, any>): string {
		try {
			let str = key.split('.').reduce((o, i) => o[i], this.locale) as string;

			if (_DEV_) {
				if (!str.includes('{')) {
					console.warn(`i18n: '${key}' has no any arg. so ref prop directly instead of call this method.`);
				}
			}

			if (args) {
				for (const [k, v] of Object.entries(args)) {
					str = str.replace(`{${k}}`, v);
				}
			}
			return str;
		} catch (e) {
			if (_DEV_) {
				console.warn(`missing localization '${key}'`);
				return `⚠'${key}'⚠`;
			}

			return key;
		}
	}
}

export const i18n = markRaw(new I18n(locale));

// このファイルに書きたくないけどここに書かないと何故かVeturが認識しない
declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		$t: typeof i18n['t'];
		$ts: typeof i18n['locale'];
	}
}
