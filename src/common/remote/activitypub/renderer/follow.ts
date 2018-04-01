import config from '../../../../conf';
import { IRemoteUser } from '../../../../models/user';

export default ({ username }, followee: IRemoteUser) => ({
	type: 'Follow',
	actor: `${config.url}/@${username}`,
	object: followee.account.uri
});
