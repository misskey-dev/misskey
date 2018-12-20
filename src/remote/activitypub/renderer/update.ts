import config from '../../../config';
import { ILocalUser } from '../../../models/user';

export default (object: any, user: ILocalUser) => {
	const activity = {
		id: `${config.url}/users/${user._id}#updates/${new Date().getTime()}`,
		actor: `${config.url}/users/${user._id}`,
		type: 'Update',
		to: [ 'https://www.w3.org/ns/activitystreams#Public' ],
		object
	} as any;

	return activity;
};
