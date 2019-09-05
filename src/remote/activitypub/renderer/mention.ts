import config from '../../../config';
import { ILocalUser, User } from '../../../models/entities/user';
import { Users } from '../../../models';

export default (mention: User) => ({
	type: 'Mention',
	href: Users.isRemoteUser(mention) ? mention.uri : `${config.url}/@${(mention as ILocalUser).username}`,
	name: Users.isRemoteUser(mention) ? `@${mention.username}@${mention.host}` : `@${(mention as ILocalUser).username}`,
});
