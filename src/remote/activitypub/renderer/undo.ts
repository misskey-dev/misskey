import config from '@/config/index';
import { ILocalUser, User } from '@/models/entities/user';

export default (object: any, user: { id: User['id'] }) => {
	if (object == null) return null;

	return {
		type: 'Undo',
		actor: `${config.url}/users/${user.id}`,
		object
	};
};
