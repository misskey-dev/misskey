import config from '../../../config';
import { ILocalUser } from '../../../models/user';

export default (user: ILocalUser, note) => ({
	type: 'Like',
	actor: `${config.url}/users/${user._id}`,
	object: note.uri ? note.uri : `${config.url}/notes/${note._id}`
});
