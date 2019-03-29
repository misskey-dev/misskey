import fetchMeta from './fetch-meta';
import { ILocalUser } from '../models/entities/user';
import { Users } from '../models';

export async function fetchProxyAccount(): Promise<ILocalUser> {
	const meta = await fetchMeta();
	return await Users.findOne({ username: meta.proxyAccount, host: null }) as ILocalUser;
}
