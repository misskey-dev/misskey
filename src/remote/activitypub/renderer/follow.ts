import config from '../../../config';
import { IUser, isLocalUser } from '../../../models/user';

export default (follower: IUser, followee: IUser) => ({
	type: 'Follow',
	actor: isLocalUser(follower) ? `${config.url}/users/${follower._id}` : follower.uri,
	object: isLocalUser(followee) ? `${config.url}/users/${followee._id}` : followee.uri
});
