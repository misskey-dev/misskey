import config from '@/config';
import { User } from '@/models/entities/user';

export default (object: any, user: { id: User['id'] }) => ({
	type: 'Reject',
	actor: `${config.url}/users/${user.id}`,
	object
});
