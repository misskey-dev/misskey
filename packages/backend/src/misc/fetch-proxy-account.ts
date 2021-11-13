import { fetchMeta } from './fetch-meta';
import { ILocalUser } from '@/models/entities/user';
import { Users } from '@/models/index';

export async function fetchProxyAccount(): Promise<ILocalUser | null> {
	const meta = await fetchMeta();
	if (meta.proxyAccountId == null) return null;
	return await Users.findOneOrFail(meta.proxyAccountId) as ILocalUser;
}
