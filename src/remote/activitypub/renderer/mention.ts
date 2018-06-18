import { IUser, isRemoteUser } from '../../../models/user';
import config from '../../../config';

export default (mention: IUser) => ({
	type: 'Mention',
	href: isRemoteUser(mention) ? mention.uri : `${config.url}/@${mention.username}`,
	name: isRemoteUser(mention) ? `@${mention.username}@${mention.host}` : `@${mention.username}`,
});
