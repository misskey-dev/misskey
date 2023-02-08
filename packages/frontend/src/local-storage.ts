type Keys =
	'v' |
	'lastVersion' |
	'instance' |
	'emojis' | // TODO: indexed db
	'lastEmojisFetchedAt' |
	'account' |
	'accounts' |
	'latestDonationInfoShownAt' |
	'neverShowDonationInfo' |
	'lastUsed' |
	'lang' |
	'drafts' |
	'hashtags' |
	'wallpaper' |
	'theme' |
	'colorSchema' |
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
	`miux:${string}` |
	`ui:folder:${string}` |
	`themes:${string}` |
	`aiscript:${string}`;

export const miLocalStorage = {
	getItem: (key: Keys) => window.localStorage.getItem(key),
	setItem: (key: Keys, value: string) => window.localStorage.setItem(key, value),
	removeItem: (key: Keys) => window.localStorage.removeItem(key),
};
