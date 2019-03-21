import fetchMeta from './fetch-meta';
import { Users } from '../models/user';

export async function fetchProxyAccount(): Promise<ILocalUser> {
	const meta = await fetchMeta();
	return await Users.findOne({ username: meta.proxyAccount, host: null }) as ILocalUser;
}
