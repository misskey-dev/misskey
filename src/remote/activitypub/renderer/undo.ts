import config from '@/config';
import { ILocalUser, User } from '../../../models/entities/user';

export default (object: any, user: { id: User['id'] }) => ({
	type: 'Undo',
	actor: `${config.url}/users/${user.id}`,
	object
});
