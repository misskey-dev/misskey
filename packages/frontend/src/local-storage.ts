/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type Keys =
	'v' |
	'lastVersion' |
	'instance' |
	'account' |
	'accounts' |
	'latestDonationInfoShownAt' |
	'neverShowDonationInfo' |
	'neverShowLocalOnlyInfo' |
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
	'emojis' // DEPRECATED, stored in indexeddb (13.9.0~);

export const miLocalStorage = {
	getItem: (key: Keys): string | null => window.localStorage.getItem(key),
	setItem: (key: Keys, value: string): void => window.localStorage.setItem(key, value),
	removeItem: (key: Keys): void => window.localStorage.removeItem(key),
	getItemAsJson: (key: Keys): any | undefined => {
		const item = miLocalStorage.getItem(key);
		if (item === null) {
			return undefined;
		}
		return JSON.parse(item);
	},
	setItemAsJson: (key: Keys, value: any): void => window.localStorage.setItem(key, JSON.stringify(value)),
};
