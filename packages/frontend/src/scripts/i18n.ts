/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { ILocale, ParameterizedString } from '../../../../locales/index.js';

type FlattenKeys<T extends ILocale, TPrediction> = keyof {
	[K in keyof T as T[K] extends ILocale
		? FlattenKeys<T[K], TPrediction> extends infer C extends string
			? `${K & string}.${C}`
			: never
		: T[K] extends TPrediction
			? K
			: never]: T[K];
};

type ParametersOf<T extends ILocale, TKey extends FlattenKeys<T, ParameterizedString<string>>> = T extends ILocale
	? TKey extends `${infer K}.${infer C}`
		// @ts-expect-error -- C は明らかに FlattenKeys<T[K], ParameterizedString<string>> になるが、型システムはここでは TKey がドット区切りであることのコンテキストを持たないので、型システムに合法にて示すことはできない。
		? ParametersOf<T[K], C>
		: TKey extends keyof T
			? T[TKey] extends ParameterizedString<infer P>
				? P
				: never
			: never
	: never;

type Ts<T extends ILocale> = {
	readonly [K in keyof T as T[K] extends ParameterizedString<string> ? never : K]: T[K] extends ILocale ? Ts<T[K]> : string;
};

export class I18n<T extends ILocale> {
	constructor(private locale: T) {
		//#region BIND
		this.t = this.t.bind(this);
		//#endregion
	}

	public get ts(): Ts<T> {
		if (_DEV_) {
			class Handler<TTarget extends object> implements ProxyHandler<TTarget> {
				get(target: TTarget, p: string | symbol): unknown {
					const value = target[p as keyof TTarget];

					if (typeof value === 'object') {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- 実際には null がくることはないので。
						return new Proxy(value!, new Handler<TTarget[keyof TTarget] & object>());
					}

					if (typeof value === 'string') {
						const parameters = Array.from(value.matchAll(/\{(\w+)\}/g), ([, parameter]) => parameter);

						if (parameters.length) {
							console.error(`Missing locale parameters: ${parameters.join(', ')} at ${String(p)}`);
						}

						return value;
					}

					console.error(`Unexpected locale key: ${String(p)}`);

					return p;
				}
			}

			return new Proxy(this.locale, new Handler()) as Ts<T>;
		}

		return this.locale as Ts<T>;
	}

	/**
	 * @deprecated なるべくこのメソッド使うよりも locale 直接参照の方が vue のキャッシュ効いてパフォーマンスが良いかも
	 */
	public t<TKey extends FlattenKeys<T, string>>(key: TKey): string;
	public t<TKey extends FlattenKeys<T, ParameterizedString<string>>>(key: TKey, args: { readonly [_ in ParametersOf<T, TKey>]: string | number }): string;
	public t(key: string, args?: { readonly [_: string]: string | number }) {
		let str: string | ParameterizedString<string> | ILocale = this.locale;

		for (const k of key.split('.')) {
			str = str[k];

			if (_DEV_) {
				if (typeof str === 'undefined') {
					console.error(`Unexpected locale key: ${key}`);
					return key;
				}
			}
		}

		if (args) {
			if (_DEV_) {
				const missing = Array.from((str as string).matchAll(/\{(\w+)\}/g), ([, parameter]) => parameter).filter(parameter => !Object.hasOwn(args, parameter));

				if (missing.length) {
					console.error(`Missing locale parameters: ${missing.join(', ')} at ${key}`);
				}
			}

			for (const [k, v] of Object.entries(args)) {
				const search = `{${k}}`;

				if (_DEV_) {
					if (!(str as string).includes(search)) {
						console.error(`Unexpected locale parameter: ${k} at ${key}`);
					}
				}

				str = (str as string).replace(search, v.toString());
			}
		}

		return str;
	}
}
