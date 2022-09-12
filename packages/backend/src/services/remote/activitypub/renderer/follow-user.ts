import config from '@/config/index.js';
import { Users } from '@/models/index.js';
import { User } from '@/models/entities/user.js';

/**
 * Convert (local|remote)(Follower|Followee)ID to URL
 * @param id Follower|Followee ID
 */
export default async function renderFollowUser(id: User['id']): Promise<any> {
	const user = await Users.findOneByOrFail({ id: id });
	return Users.isLocalUser(user) ? `${config.url}/users/${user.id}` : user.uri;
}
