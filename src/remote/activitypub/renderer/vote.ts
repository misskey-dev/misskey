import config from '../../../config';
import { INote } from '../../../models/note';
import { IRemoteUser, ILocalUser } from '../../../models/user';
import { IPollVote } from '../../../models/poll-vote';

export default async function renderVote(user: ILocalUser, vote: IPollVote, pollNote: INote, pollOwner: IRemoteUser): Promise<any> {
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
