import config from '../../../config';
import User, { isLocalUser } from '../../../models/entities/user';

/**
 * Convert (local|remote)(Follower|Followee)ID to URL
 * @param id Follower|Followee ID
 */
export default async function renderFollowUser(id: mongo.ObjectID): Promise<any> {

	const user = await Users.findOne({
		id: id
	});

	return isLocalUser(user) ? `${config.url}/users/${user.id}` : user.uri;
}
