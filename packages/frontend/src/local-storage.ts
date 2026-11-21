/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { safeJsonParse } from '@/utility/safe-json-parse.js';

export type Keys = (
	'v' |
	'lastVersion' |
	'instance' |
	'instanceCachedAt' |
	'account' |
	'latestDonationInfoShownAt' |
	'neverShowDonationInfo' |
	'neverShowLocalOnlyInfo' |
	'modifiedVersionMustProminentlyOfferInAgplV3Section13Read' |
	'lastUsed' |
	'lang' |
	'drafts' |
	'hashtags' |
	'colorScheme' |
	'useSystemFont' |
	'fontSize' |
	'ui' |
	'ui_temp' |
	'bootloaderLocales' |
	'theme' |
	'themeId' |
	'themeCachedVersion' |
	'customCss' |
	'chatMessageDrafts' |
	'scratchpad' |
	'debug' |
	'preferences' |
	'latestPreferencesUpdate' |
	'hidePreferencesRestoreSuggestion' |
	'isSafeMode' |
	`miux:${string}` |
	`ui:folder:${string}` |
	`themes:${string}` | // DEPRECATED
	`aiscript:${string}` |
	'lastEmojisFetchedAt' | // DEPRECATED, stored in indexeddb (13.9.0~)
	'emojis' | // DEPRECATED, stored in indexeddb (13.9.0~);
	`channelLastReadedAt:${string}` |
	`idbfallback::${string}`
);

// セッション毎に廃棄されるLocalStorage代替（セーフモードなどで使用できそう）
//const safeSessionStorage = new Map<Keys, string>();

export const miLocalStorage = {
	getItem: (key: Keys): string | null => {
		return window.localStorage.getItem(key);
	},
	setItem: (key: Keys, value: string): void => {
		window.localStorage.setItem(key, value);
	},
	removeItem: (key: Keys): void => {
		window.localStorage.removeItem(key);
	},
	getItemAsJson: (key: Keys): any | undefined => {
		// 破損したデータで例外にならないようガードする
		return safeJsonParse<any>(miLocalStorage.getItem(key), undefined, err => {
			console.error(`failed to parse localStorage item: ${key}`, err);
		});
	},
	setItemAsJson: (key: Keys, value: any): void => {
		miLocalStorage.setItem(key, JSON.stringify(value));
	},
};
