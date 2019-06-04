import config from '../../../config';
import { ILocalUser } from '../../../models/entities/user';

export default (user: ILocalUser, target: unknown, object: unknown) => ({
	type: 'Add',
	actor: `${config.url}/users/${user.id}`,
	target,
	object
});
