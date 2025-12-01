/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Languages Loader
 */

import * as fs from 'node:fs';
import * as yaml from 'js-yaml';
import { languages, primaries } from './const.js';
import type { Locale } from './autogen/locale.js';
import type { ILocale, ParameterizedString } from './types.js';

type Language = typeof languages[number];

type PrimaryLang = keyof typeof primaries;

type Locales = Record<Language, ILocale>;

/**
 * オブジェクトを再帰的にマージする
 */
function merge<T extends ILocale>(...args: (T | ILocale | undefined)[]): T {
	return args.reduce<ILocale>((a, c) => ({
		...a,
		...c,
		...Object.entries(a)
			.filter(([k]) => c && typeof c[k] === 'object')
			.reduce<Record<string, ILocale[string]>>((acc, [k, v]) => {
				acc[k] = merge(v as ILocale, (c as ILocale)[k] as ILocale);
				return acc;
			}, {}),
	}), {} as ILocale) as T;
}

/**
 * 何故か文字列にバックスペース文字が混入することがあり、YAMLが壊れるので取り除く
 */
function clean (text: string) {
	return text.replace(new RegExp(String.fromCodePoint(0x08), 'g'), '');
}

/**
 * 空文字列が入ることがあり、フォールバックが動作しなくなるのでプロパティごと消す
 */
function removeEmpty<T extends ILocale>(obj: T): T {
	for (const [k, v] of Object.entries(obj)) {
		if (v === '') {
			delete obj[k];
		} else if (typeof v === 'object') {
			removeEmpty(v as ILocale);
		}
	}
	return obj;
}

function build(): Record<Language, Locale> {
	// vitestの挙動を調整するため、一度ローカル変数化する必要がある
	// https://github.com/vitest-dev/vitest/issues/3988#issuecomment-1686599577
	// https://github.com/misskey-dev/misskey/pull/14057#issuecomment-2192833785
	const metaUrl = import.meta.url;
	const locales = languages.reduce<Locales>((a, lang) => {
		a[lang] = (yaml.load(clean(fs.readFileSync(new URL(`./locales/${lang}.yml`, metaUrl), 'utf-8'))) ?? {}) as ILocale;
		return a;
	}, {} as Locales);

	removeEmpty(locales);

	return Object.entries(locales).reduce<Record<Language, Locale>>((a, [k, v]) => {
		const lang = k.split('-')[0];
		const key = k as Language;

		switch (key) {
			case 'ja-JP':
				a[key] = v as Locale;
				break;
			case 'ja-KS':
			case 'en-US':
				a[key] = merge<Locale>(locales['ja-JP'] as Locale, v);
				break;
			default: {
				const primaryLang = lang as PrimaryLang;
				const primaryKey = (lang in primaries ? `${lang}-${primaries[primaryLang]}` : undefined) as Language | undefined;
				a[key] = merge<Locale>(
					locales['ja-JP'] as Locale,
					locales['en-US'],
					primaryKey ? locales[primaryKey] : {},
					v,
				);
				break;
			}
		}

		return a;
	}, {} as Record<Language, Locale>);
}

const locales = build() as {
	[lang: string]: Locale;
};

/**
 * フロントエンド用の locale JSON を書き出す
 * Service Worker が HTTP 経由で取得するために必要
 * @param destDir 出力先ディレクトリ（例: built/_frontend_dist_/locales）
 * @param version バージョン文字列（ファイル名とJSON内に埋め込まれる）
 */
async function writeFrontendLocalesJson(destDir: string, version: string): Promise<void> {
	const { mkdir, writeFile } = await import('node:fs/promises');
	const { resolve } = await import('node:path');

	await mkdir(destDir, { recursive: true });

	const builtLocales = build();
	const v = { '_version_': version };

	for (const [lang, locale] of Object.entries(builtLocales)) {
		await writeFile(
			resolve(destDir, `${lang}.${version}.json`),
			JSON.stringify({ ...locale, ...v }),
			'utf-8',
		);
	}
}

export { locales, languages, build, writeFrontendLocalesJson };
export type { Language, Locale, ILocale, ParameterizedString };
export default locales;
