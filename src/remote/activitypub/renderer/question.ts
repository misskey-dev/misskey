import config from '../../../config';
import { ILocalUser } from '../../../models/user';
import { INote } from '../../../models/note';

export default async function renderQuestion(user: ILocalUser, note: INote) {
	const question =  {
		type: 'Question',
		id: `${config.url}/questions/${note._id}`,
		actor: `${config.url}/users/${user._id}`,
		content:  note.text != null ? note.text : '',
		oneOf: note.poll.choices.map(c => {
			return {
				name: c.text,
				_misskey_votes: c.votes,
			};
		}),
	};

	return question;
}
