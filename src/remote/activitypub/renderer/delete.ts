import config from '../../../config';
import { ILocalUser } from '../../../models/entities/user';

export default (object: unknown, user: ILocalUser) => ({
	type: 'Delete',
	actor: `${config.url}/users/${user.id}`,
	object
});
