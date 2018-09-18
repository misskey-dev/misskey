import config from '../../../config';
import { ILocalUser } from '../../../models/user';

export default (user: ILocalUser, target: any, object: any) => ({
	type: 'Remove',
	actor: `${config.url}/users/${user._id}`,
	target,
	object
});
