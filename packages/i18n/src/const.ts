/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const languages = [
	'ar-SA',
	'ca-ES',
	'cs-CZ',
	'da-DK',
	'de-DE',
	'en-US',
	'es-ES',
	'fr-FR',
	'id-ID',
	'it-IT',
	'ja-JP',
	'ja-KS',
	'kab-KAB',
	'kn-IN',
	'ko-KR',
	'nl-NL',
	'no-NO',
	'pl-PL',
	'pt-PT',
	'ru-RU',
	'sk-SK',
	'th-TH',
	'tr-TR',
	'ug-CN',
	'uk-UA',
	'vi-VN',
	'zh-CN',
	'zh-TW',
] as const;

export const primaries = {
	'en': 'US',
	'ja': 'JP',
	'zh': 'CN',
} as const satisfies Record<string, string>;
