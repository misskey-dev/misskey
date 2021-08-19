import config from '@/config/index';
import { Users } from '@/models/index';
import { User } from '@/models/entities/user';

/**
 * Convert (local|remote)(Follower|Followee)ID to URL
 * @param id Follower|Followee ID
 */
export default async function renderFollowUser(id: User['id']): Promise<any> {
	const user = await Users.findOneOrFail(id);
	return Users.isLocalUser(user) ? `${config.url}/users/${user.id}` : user.uri;
}
