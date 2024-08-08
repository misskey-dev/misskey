/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { isEmbedPage } from '@/scripts/embed-page.js';

export type Keys =
	'v' |
	'lastVersion' |
	'instance' |
	'instanceCachedAt' |
	'account' |
	'accounts' |
	'latestDonationInfoShownAt' |
	'neverShowDonationInfo' |
	'neverShowLocalOnlyInfo' |
	'modifiedVersionMustProminentlyOfferInAgplV3Section13Read' |
	'lastUsed' |
	'lang' |
	'drafts' |
	'hashtags' |
	'wallpaper' |
	'theme' |
	'colorScheme' |
	'useSystemFont' |
	'fontSize' |
	'ui' |
	'ui_temp' |
	'locale' |
	'localeVersion' |
	'theme' |
	'customCss' |
	'message_drafts' |
	'scratchpad' |
	'debug' |
	`miux:${string}` |
	`ui:folder:${string}` |
	`themes:${string}` |
	`aiscript:${string}` |
	'lastEmojisFetchedAt' | // DEPRECATED, stored in indexeddb (13.9.0~)
	'emojis' | // DEPRECATED, stored in indexeddb (13.9.0~);
	`channelLastReadedAt:${string}` |
	`idbfallback::${string}`

// セッション毎に廃棄されるLocalStorage代替（embedなどで使用）
const safeSessionStorage = new Map<Keys, string>();

const embedPage = isEmbedPage();

export const miLocalStorage = {
	getItem: (key: Keys): string | null => {
		if (embedPage) {
			return safeSessionStorage.get(key) ?? null;
		}
		return window.localStorage.getItem(key);
	},
	setItem: (key: Keys, value: string): void => {
		if (embedPage) {
			safeSessionStorage.set(key, value);
		} else {
			window.localStorage.setItem(key, value);
		}
	},
	removeItem: (key: Keys): void => {
		if (embedPage) {
			safeSessionStorage.delete(key);
		} else {
			window.localStorage.removeItem(key);
		}
	},
	getItemAsJson: (key: Keys): any | undefined => {
		const item = miLocalStorage.getItem(key);
		if (item === null) {
			return undefined;
		}
		return JSON.parse(item);
	},
	setItemAsJson: (key: Keys, value: any): void => {
		miLocalStorage.setItem(key, JSON.stringify(value));
	},
};

if (embedPage) {
	/**
	 * EmbedページではlocalStorageを使用できないようにしているが、
	 * 動作に必要な値はsafeSessionStorageに移動する
	 */
	const keysToDuplicate: Keys[] = [
		'v',
		'instance',
		'instanceCachedAt',
		'lang',
		'locale',
		'localeVersion',
	];

	keysToDuplicate.forEach(key => {
		const value = window.localStorage.getItem(key);
		if (value && !miLocalStorage.getItem(key)) {
			miLocalStorage.setItem(key, value);
		}
	});
	if (_DEV_) console.warn('Using safeSessionStorage as localStorage alternative');
}
