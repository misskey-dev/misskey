import config from '@/config/index.js';
import { User } from '@/models/entities/user.js';

export default (object: any, user: { id: User['id']; host: null }) => ({
	type: 'Delete',
	actor: `${config.url}/users/${user.id}`,
	object,
	published: new Date().toISOString(),
});
