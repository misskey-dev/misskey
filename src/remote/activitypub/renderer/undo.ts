import config from '../../../config';
import { ILocalUser, User } from '../../../models/user';

export default (object: any, user: ILocalUser | User) => ({
	type: 'Undo',
	actor: `${config.url}/users/${user.id}`,
	object
});
