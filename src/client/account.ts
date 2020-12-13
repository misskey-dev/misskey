import { reactive } from 'vue';
import { apiUrl } from './config';

// TODO: 他のタブと永続化されたstateを同期

type Account = {
	id: string;
	token: string;
	clientData: any;
};

const data = localStorage.getItem('account');

// TODO: 外部からはreadonlyに
export const $i = data ? reactive(JSON.parse(data) as Account) : null;
export const isSignedIn = $i != null;

export function signout() {
	// TODO
	location.href = '/';
}

const accountsData = localStorage.getItem('accounts');
export const accounts: { id: Account['id'], token: Account['token'] }[] = accountsData ? JSON.parse(accountsData) : [];

function addAccount(id: Account['id'], token: Account['token']) {
	if (!accounts.some(x => x.id === id)) {
		localStorage.setItem('accounts', JSON.stringify(accounts.concat([{ id, token }])));
	}
}

function fetchAccount(token): Promise<Account> {
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

export function updateAccount(data) {
	for (const [key, value] of Object.entries(data)) {
		$i[key] = value;
	}

	if (data.clientData) {
		setAccountSettings(data.clientData);
	}
}

export function refreshAccount() {
	fetchAccount($i.token).then(updateAccount);
}

export async function setAccount(token) {
	const me = await fetchAccount(token);
	localStorage.setItem('account', JSON.stringify(me));
	addAccount(me.id, token);
}
