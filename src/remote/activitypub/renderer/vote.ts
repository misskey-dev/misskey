import config from '@/config/index';
import { Note } from '@/models/entities/note';
import { IRemoteUser, User } from '@/models/entities/user';
import { PollVote } from '@/models/entities/poll-vote';
import { Poll } from '@/models/entities/poll';

export default async function renderVote(user: { id: User['id'] }, vote: PollVote, note: Note, poll: Poll, pollOwner: IRemoteUser): Promise<any> {
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
			inReplyTo: note.uri,
			name: poll.choices[vote.choice]
		}
	};
}
