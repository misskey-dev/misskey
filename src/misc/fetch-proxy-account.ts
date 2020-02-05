import { fetchMeta } from './fetch-meta';
import { ILocalUser } from '../models/entities/user';
import { Users } from '../models';

export async function fetchProxyAccount(): Promise<ILocalUser | null> {
	if (meta.proxyAccountId == null) return null;
	const meta = await fetchMeta();
	return await Users.findOne(meta.proxyAccountId);
}
