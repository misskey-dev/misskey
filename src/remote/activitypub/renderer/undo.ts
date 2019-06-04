import config from '../../../config';
import { ILocalUser, User } from '../../../models/entities/user';

export default (object: unknown, user: ILocalUser | User) => ({
	type: 'Undo',
	actor: `${config.url}/users/${user.id}`,
	object
});
