import config from '../../../config';
import { Users } from '../../../models';
import { User } from '../../../models/entities/user';
import { ensure } from '../../../prelude/ensure';

/**
 * Convert (local|remote)(Follower|Followee)ID to URL
 * @param id Follower|Followee ID
 */
export default async function renderFollowUser(id: User['id']): Promise<any> {
	const user = await Users.findOne(id).then(ensure);
	return Users.isLocalUser(user) ? `${config.url}/users/${user.id}` : user.uri;
}
