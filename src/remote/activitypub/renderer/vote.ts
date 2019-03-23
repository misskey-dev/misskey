import config from '../../../config';
import { Note } from '../../../models/entities/note';
import { IRemoteUser, ILocalUser } from '../../../models/entities/user';
import { IPollVote } from '../../../models/entities/poll-vote';

export default async function renderVote(user: ILocalUser, vote: IPollVote, pollNote: Note, pollOwner: IRemoteUser): Promise<any> {
	return {
		id: `${config.url}/users/${user.id}#votes/${vote.id}/activity`,
		actor: `${config.url}/users/${user.id}`,
		type: 'Create',
		to: [pollOwner.uri],
		published: new Date().toISOString(),
		object: {
			id: `${config.url}/users/${user.id}#votes/${vote.id}`,
			type: 'Note',
			attributedTo: `${config.url}/users/${user.id}`,
			to: [pollOwner.uri],
			inReplyTo: pollNote.uri,
			name: pollNote.poll.choices.find(x => x.id === vote.choice).text
		}
	};
}
