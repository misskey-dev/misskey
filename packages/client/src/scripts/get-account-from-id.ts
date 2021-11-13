import { get } from '@/scripts/idb-proxy';

export async function getAccountFromId(id: string) {
	const accounts = await get('accounts') as { token: string; id: string; }[];
	if (!accounts) console.log('Accounts are not recorded');
	return accounts.find(e => e.id === id);
}
