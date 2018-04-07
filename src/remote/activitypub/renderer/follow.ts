import config from '../../../config';
import { IRemoteUser, ILocalUser } from '../../../models/user';

export default (follower: ILocalUser, followee: IRemoteUser) => ({
	type: 'Follow',
	actor: `${config.url}/@${follower.username}`,
	object: followee.uri
});
