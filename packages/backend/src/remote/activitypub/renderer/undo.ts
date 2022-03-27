import config from '@/config/index.js';
import { ILocalUser, User } from '@/models/entities/user.js';

export default (object: any, user: { id: User['id'] }) => {
	if (object == null) return null;
	const id = typeof object.id === 'string' && object.id.startsWith(config.url) ? `${object.id}/undo` : undefined;

	return {
		type: 'Undo',
		...(id ? { id } : {}),
		actor: `${config.url}/users/${user.id}`,
		object,
		published: new Date().toISOString(),
	};
};
