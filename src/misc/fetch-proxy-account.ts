import fetchMeta from './fetch-meta';
import { Users } from '../models/entities/user';

export async function fetchProxyAccount(): Promise<ILocalUser> {
	const meta = await fetchMeta();
	return await Users.findOne({ username: meta.proxyAccount, host: null }) as ILocalUser;
}
