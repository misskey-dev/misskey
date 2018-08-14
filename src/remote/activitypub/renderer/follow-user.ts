import config from '../../../config';
import * as mongo from 'mongodb';
import User, { isLocalUser } from '../../../models/user';

/**
 * Convert (local|remote)(Follower|Followee)ID to URL
 * @param id Follower|Followee ID
 */
export default async function renderFollowUser(id: mongo.ObjectID): Promise<any> {

	const user = await User.findOne({
		_id: id
	});

	return isLocalUser(user) ? `${config.url}/users/${user._id}` : user.uri;
}
