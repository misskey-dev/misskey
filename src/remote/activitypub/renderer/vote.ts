import config from '../../../config';
import { INote } from '../../../models/note';
import { IRemoteUser, ILocalUser } from '../../../models/user';

export default async function renderVote(user: ILocalUser, choice: number, pollNote: INote, pollOwner: IRemoteUser): Promise<any> {
	const attributedTo = `${config.url}/users/${user._id}`;

	const to: string[] = [pollOwner.uri];

	return {
		id: `${config.url}/notes/${note._id}`,
		type: 'Note',
		attributedTo,
		content: choice,
		published: (new Date()).toISOString(),
		to,
		inReplyTo: pollNote.uri,
		name: pollNote.poll.choices.find(x => x.id === choice).text
	};
}
