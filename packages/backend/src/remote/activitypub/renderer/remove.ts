import config from '@/config/index';
import { User } from '@/models/entities/user';

export default (user: { id: User['id'] }, target: any, object: any) => ({
	type: 'Remove',
	actor: `${config.url}/users/${user.id}`,
	target,
	object,
});
