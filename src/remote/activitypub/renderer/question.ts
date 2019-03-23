import config from '../../../config';
import { ILocalUser } from '../../../models/entities/user';
import { Note } from '../../../models/entities/note';

export default async function renderQuestion(user: ILocalUser, note: Note) {
	const question = {
		type: 'Question',
		id: `${config.url}/questions/${note.id}`,
		actor: `${config.url}/users/${user.id}`,
		content:  note.text || '',
		[note.poll.multiple ? 'anyOf' : 'oneOf']: note.poll.choices.map(c => ({
			name: c.text,
			_misskey_votes: c.votes,
			replies: {
				type: 'Collection',
				totalItems: c.votes
			}
		}))
	};

	return question;
}
