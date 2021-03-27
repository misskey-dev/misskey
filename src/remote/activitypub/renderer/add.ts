import config from '@/config';
import { ILocalUser } from '../../../models/entities/user';

export default (user: ILocalUser, target: any, object: any) => ({
	type: 'Add',
	actor: `${config.url}/users/${user.id}`,
	target,
	object
});
