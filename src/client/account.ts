import { reactive } from 'vue';
import { apiUrl } from '@client/config';
import { waiting } from '@client/os';
import { unisonReload } from '@client/scripts/unison-reload';

// TODO: 他のタブと永続化されたstateを同期

type Account = {
	id: string;
	token: string;
};

const data = localStorage.getItem('account');

// TODO: 外部からはreadonlyに
export const $i = data ? reactive(JSON.parse(data) as Account) : null;

export function signout() {
	localStorage.removeItem('account');
	document.cookie = `igi=; path=/`;
	location.href = '/';
}

export function getAccounts() {
	const accountsData = localStorage.getItem('accounts');
	const accounts: { id: Account['id'], token: Account['token'] }[] = accountsData ? JSON.parse(accountsData) : [];
	return accounts;
}

export function addAccount(id: Account['id'], token: Account['token']) {
	const accounts = getAccounts();
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
	localStorage.setItem('account', JSON.stringify($i));
}

export function refreshAccount() {
	fetchAccount($i.token).then(updateAccount);
}

export async function login(token: Account['token']) {
	waiting();
	if (_DEV_) console.log('logging as token ', token);
	const me = await fetchAccount(token);
	localStorage.setItem('account', JSON.stringify(me));
	addAccount(me.id, token);
	unisonReload();
}

// このファイルに書きたくないけどここに書かないと何故かVeturが認識しない
declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		$i: typeof $i;
	}
}
