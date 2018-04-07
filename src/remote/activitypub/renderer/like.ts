import config from '../../../config';
import { ILocalUser } from '../../../models/user';

export default (user: ILocalUser, note) => {
	return {
		type: 'Like',
		actor: `${config.url}/@${user.username}`,
		object: note.uri ? note.uri : `${config.url}/notes/${note._id}`
	};
};
