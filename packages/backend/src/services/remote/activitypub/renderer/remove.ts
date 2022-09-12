import config from '@/config/index.js';
import { User } from '@/models/entities/user.js';

export default (user: { id: User['id'] }, target: any, object: any) => ({
	type: 'Remove',
	actor: `${config.url}/users/${user.id}`,
	target,
	object,
});
