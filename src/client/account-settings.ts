import { reactive } from 'vue';

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

const data = localStorage.getItem('accountSettings');

export const accountSettings = reactive(data ? JSON.parse(data) : defaultAccountSettings);

export function setAccountSettings(data: Record<string, any>) {
	for (const [key, value] of Object.entries(defaultAccountSettings)) {
		if (Object.prototype.hasOwnProperty.call(data, key)) {
			accountSettings[key] = data[key];
		} else {
			accountSettings[key] = value;
		}
	}
}
