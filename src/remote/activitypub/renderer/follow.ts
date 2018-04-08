import config from '../../../config';
import { IRemoteUser, ILocalUser } from '../../../models/user';

export default (follower: ILocalUser, followee: IRemoteUser) => ({
	type: 'Follow',
	actor: `${config.url}/users/${follower._id}`,
	object: followee.uri
});
