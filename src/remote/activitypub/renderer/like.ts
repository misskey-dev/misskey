import config from '../../../config';
import { ILocalUser } from '../../../models/entities/user';
import { Note } from '../../../models/entities/note';

export default (user: ILocalUser, note: Note, reaction: string) => ({
	type: 'Like',
	actor: `${config.url}/users/${user.id}`,
	object: note.uri ? note.uri : `${config.url}/notes/${note.id}`,
	_misskey_reaction: reaction
});
