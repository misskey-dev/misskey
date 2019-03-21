import config from '../../../config';
import { ILocalUser } from '../../../models/user';
import { INote } from '../../../models/note';

export default (user: ILocalUser, note: INote, reaction: string) => ({
	type: 'Like',
	actor: `${config.url}/users/${user.id}`,
	object: note.uri ? note.uri : `${config.url}/notes/${note.id}`,
	_misskey_reaction: reaction
});
