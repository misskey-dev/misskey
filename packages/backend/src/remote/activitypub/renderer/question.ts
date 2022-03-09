import config from '@/config/index.js';
import { User } from '@/models/entities/user.js';
import { Note } from '@/models/entities/note.js';
import { Poll } from '@/models/entities/poll.js';

export default async function renderQuestion(user: { id: User['id'] }, note: Note, poll: Poll) {
	const question = {
		type: 'Question',
		id: `${config.url}/questions/${note.id}`,
		actor: `${config.url}/users/${user.id}`,
		content: note.text || '',
		[poll.multiple ? 'anyOf' : 'oneOf']: poll.choices.map((text, i) => ({
			name: text,
			_misskey_votes: poll.votes[i],
			replies: {
				type: 'Collection',
				totalItems: poll.votes[i],
			},
		})),
	};

	return question;
}
