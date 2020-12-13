import { reactive } from 'vue';
import { isSignedIn } from './account';
import { api } from './os';

export const defaultAccountSettings = {
	tutorial: 0,
	keepCw: false,
	showFullAcct: false,
	rememberNoteVisibility: false,
	defaultNoteVisibility: 'public',
	defaultNoteLocalOnly: false,
	uploadFolder: null,
	pastedFileName: 'yyyy-MM-dd HH-mm-ss [{{number}}]',
	memo: null,
	reactions: ['👍', '❤️', '😆', '🤔', '😮', '🎉', '💢', '😥', '😇', '🍮'],
	mutedWords: [],
};

const settings = localStorage.getItem('accountSettings');

// TODO: エクスポートするものはreadonlyにする
export const accountSettings = reactive(settings ? JSON.parse(settings) : defaultAccountSettings);

export function updateAccountSetting(key, value) {
	if (isSignedIn) {
		api('i/update-client-setting', {
			name: key,
			value: value
		});
	}
}

export function setAccountSettings(data: Record<string, any>) {
	for (const [key, value] of Object.entries(defaultAccountSettings)) {
		if (Object.prototype.hasOwnProperty.call(data, key)) {
			accountSettings[key] = data[key];
		} else {
			accountSettings[key] = value;
		}
	}
}

// このファイルに書きたくないけどここに書かないと何故かVeturが認識しない
declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		$accountSettings: typeof accountSettings;
	}
}
