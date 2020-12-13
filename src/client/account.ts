import { reactive, ref } from 'vue';
import { apiUrl } from './config';

type Account = {
	id: string;
	token: string;
};

const data = localStorage.getItem('account');

export const $i = data ? reactive(JSON.parse(data) as Account) : null;
export const isSignedIn = $i != null;

export function signout() {
	// TODO
	location.href = '/';
}

function fetchAccount(token) {
	return new Promise((done, fail) => {
		// Fetch user
		fetch(`${apiUrl}/i`, {
			method: 'POST',
			body: JSON.stringify({
				i: token
			})
		})
		.then(res => {
			// When failed to authenticate user
			if (res.status !== 200 && res.status < 500) {
				return signout();
			}

			// Parse response
			res.json().then(i => {
				i.token = token;
				done(i);
			});
		})
		.catch(fail);
	});
}

export function refreshAccount() {
	fetchAccount($i.token).then(data => {
		for (const [key, value] of Object.entries(data)) {
			$i[key] = value;
		}

		setAccountSettings(data.clientData);
	});
}

export async function setAccount(token) {
	const me = await fetchAccount(token);
	localStorage.setItem('account', JSON.stringify(me));
}

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

export const accountSettings = reactive(settings ? JSON.parse(settings) : defaultAccountSettings);

export function setAccountSettings(data: Record<string, any>) {
	for (const [key, value] of Object.entries(defaultAccountSettings)) {
		if (Object.prototype.hasOwnProperty.call(data, key)) {
			accountSettings[key] = data[key];
		} else {
			accountSettings[key] = value;
		}
	}
}
