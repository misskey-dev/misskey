import { fetchMeta } from './fetch-meta';
import { ILocalUser } from '../models/entities/user';
import { Users } from '../models';
import { ensure } from '../prelude/ensure';

export async function fetchProxyAccount(): Promise<ILocalUser | null> {
	const meta = await fetchMeta();
	if (meta.proxyAccountId == null) return null;
	return await Users.findOne(meta.proxyAccountId).then(ensure) as ILocalUser;
}
