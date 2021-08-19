import config from '@/config/index.js';
import { User, ILocalUser } from '@/models/entities/user.js';
import { Users } from '@/models/index.js';

export default (mention: User) => ({
	type: 'Mention',
	href: Users.isRemoteUser(mention) ? mention.uri : `${config.url}/users/${(mention as ILocalUser).id}`,
	name: Users.isRemoteUser(mention) ? `@${mention.username}@${mention.host}` : `@${(mention as ILocalUser).username}`,
});
