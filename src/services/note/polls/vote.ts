import watch from '../../../services/note/watch';
import { publishNoteStream } from '../../stream';
import notify from '../../../services/create-notification';
import { User } from '../../../models/entities/user';
import { Note } from '../../../models/entities/note';
import { PollVotes, Users, Notes, NoteWatchings } from '../../../models';
import { Not } from 'typeorm';

export default (user: User, note: Note, choice: number) => new Promise(async (res, rej) => {
	if (!note.poll.choices.some(x => x.id == choice)) return rej('invalid choice param');

	// if already voted
	const exist = await PollVotes.find({
		noteId: note.id,
		userId: user.id
	});

	if (note.poll.multiple) {
		if (exist.some(x => x.choice === choice)) {
			return rej('already voted');
		}
	} else if (exist.length !== 0) {
		return rej('already voted');
	}

	// Create vote
	await PollVotes.save({
		createdAt: new Date(),
		noteId: note.id,
		userId: user.id,
		choice: choice
	});

	res();

	const index = note.poll.choices.findIndex(c => c.id == choice);
	const sql = `jsonb_set(poll, '{choices,${index},votes}', (COALESCE(poll->choices->${index}->>'votes','0')::int + 1)::text::jsonb)`;

	// Increment votes count
	await Notes.createQueryBuilder('note')
		.update()
		.where('id = :id', { id: note.id })
		.set({
			poll: () => sql
		})
		.execute();

	publishNoteStream(note.id, 'pollVoted', {
		choice: choice,
		userId: user.id
	});

	// Notify
	notify(note.userId, user.id, 'pollVote', {
		noteId: note.id,
		choice: choice
	});

	// Fetch watchers
	NoteWatchings.find({
		noteId: note.id,
		userId: Not(user.id),
	})
	.then(watchers => {
		for (const watcher of watchers) {
			notify(watcher.userId, user.id, 'pollVote', {
				noteId: note.id,
				choice: choice
			});
		}
	});

	// ローカルユーザーが投票した場合この投稿をWatchする
	if (Users.isLocalUser(user) && user.autoWatch) {
		watch(user.id, note);
	}
});
