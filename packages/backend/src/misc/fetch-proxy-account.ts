import { fetchMeta } from './fetch-meta.js';
import { ILocalUser } from '@/models/entities/user.js';
import { Users } from '@/models/index.js';

export async function fetchProxyAccount(): Promise<ILocalUser | null> {
	const meta = await fetchMeta();
	if (meta.proxyAccountId == null) return null;
	return await Users.findOneByOrFail({ id: meta.proxyAccountId }) as ILocalUser;
}
