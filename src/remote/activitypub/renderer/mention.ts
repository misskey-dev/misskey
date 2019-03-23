import { User, isRemoteUser } from '../../../models/entities/user';
import config from '../../../config';

export default (mention: User) => ({
	type: 'Mention',
	href: isRemoteUser(mention) ? mention.uri : `${config.url}/@${mention.username}`,
	name: isRemoteUser(mention) ? `@${mention.username}@${mention.host}` : `@${mention.username}`,
});
