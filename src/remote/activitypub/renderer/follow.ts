import config from '../../../config';
import { IUser, isLocalUser } from '../../../models/user';

export default (follower: IUser, followee: IUser, requestId?: string) => {
	const follow = {
		type: 'Follow',
		actor: isLocalUser(follower) ? `${config.url}/users/${follower.id}` : follower.uri,
		object: isLocalUser(followee) ? `${config.url}/users/${followee.id}` : followee.uri
	} as any;

	if (requestId) follow.id = requestId;

	return follow;
};
