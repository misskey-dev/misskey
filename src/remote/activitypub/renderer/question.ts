import config from '@/config';
import { ILocalUser } from '../../../models/entities/user';
import { Note } from '../../../models/entities/note';
import { Poll } from '../../../models/entities/poll';

export default async function renderQuestion(user: ILocalUser, note: Note, poll: Poll) {
	const question = {
		type: 'Question',
		id: `${config.url}/questions/${note.id}`,
		actor: `${config.url}/users/${user.id}`,
		content:  note.text || '',
		[poll.multiple ? 'anyOf' : 'oneOf']: poll.choices.map((text, i) => ({
			name: text,
			_misskey_votes: poll.votes[i],
			replies: {
				type: 'Collection',
				totalItems: poll.votes[i]
			}
		}))
	};

	return question;
}
