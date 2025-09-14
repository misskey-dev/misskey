/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// common portion of bootloader for frontend and frontend-embed

import type { Locale } from '../../../locales/index.js';

export function detectLanguage(): string {
	const supportedLangs = _LANG_IDS_;
	let lang: string | null | undefined = localStorage.getItem('lang');
	if (lang == null || !supportedLangs.includes(lang)) {
		if (supportedLangs.includes(navigator.language)) {
			lang = navigator.language;
		} else {
			lang = supportedLangs.find(x => x.split('-')[0] === navigator.language);

			// Fallback
			lang ??= 'en-US';
		}
	}

	// for https://github.com/misskey-dev/misskey/issues/10202
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (lang == null || lang.toString == null || lang.toString() === 'null') {
		console.error('invalid lang value detected!!!', typeof lang, lang);
		lang = 'en-US';
	}

	return lang;
}

type BootLoaderLocales = Locale['_bootErrors'] & Pick<Locale, 'reload'>;

export function bootloaderLocales(): BootLoaderLocales {
	let messages: Partial<BootLoaderLocales> | null = null;
	const bootloaderLocalesJson = localStorage.getItem('bootloaderLocales');
	if (bootloaderLocalesJson) {
		messages = JSON.parse(bootloaderLocalesJson);
	}
	if (!messages) {
		// older version of misskey does not store bootloaderLocales, stores locale as a whole
		const legacyLocale = localStorage.getItem('locale');
		if (legacyLocale) {
			const parsed = JSON.parse(legacyLocale);
			messages = {
				...(parsed._bootErrors ?? {}),
				reload: parsed.reload,
			};
		}
	}

	return Object.assign({
		title: 'Failed to initialize Misskey',
		solution: 'The following actions may solve the problem.',
		solution1: 'Update your os and browser',
		solution2: 'Disable an adblocker',
		solution3: 'Clear the browser cache',
		solution4: '(Tor Browser) Set dom.webaudio.enabled to true',
		otherOption: 'Other options',
		otherOption1: 'Clear preferences and cache',
		otherOption2: 'Start the simple client',
		otherOption3: 'Start the repair tool',
		otherOption4: 'Start Misskey in safe mode',
		reload: 'Reload',
	}, messages) as BootLoaderLocales;
}

export function addStyle(styleText: string) {
	const styleElement = document.createElement('style');
	styleElement.appendChild(document.createTextNode(styleText));
	document.head.appendChild(styleElement);
}
