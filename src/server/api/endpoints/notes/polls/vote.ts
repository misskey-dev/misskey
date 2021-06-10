import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import { publishNoteStream } from '../../../../../services/stream';
import { createNotification } from '../../../../../services/create-notification';
import define from '../../../define';
import { ApiError } from '../../../error';
import { getNote } from '../../../common/getters';
import { deliver } from '../../../../../queue';
import { renderActivity } from '../../../../../remote/activitypub/renderer';
import renderVote from '../../../../../remote/activitypub/renderer/vote';
import { deliverQuestionUpdate } from '../../../../../services/note/polls/update';
import { PollVotes, NoteWatchings, Users, Polls } from '../../../../../models';
import { Not } from 'typeorm';
import { IRemoteUser } from '../../../../../models/entities/user';
import { genId } from '@/misc/gen-id';

export const meta = {
	tags: ['notes'],

	requireCredential: true as const,

	kind: 'write:votes',

	params: {
		noteId: {
			validator: $.type(ID),
		},

		choice: {
			validator: $.num
		},
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'ecafbd2e-c283-4d6d-aecb-1a0a33b75396'
		},

		noPoll: {
			message: 'The note does not attach a poll.',
			code: 'NO_POLL',
			id: '5f979967-52d9-4314-a911-1c673727f92f'
		},

		invalidChoice: {
			message: 'Choice ID is invalid.',
			code: 'INVALID_CHOICE',
			id: 'e0cc9a04-f2e8-41e4-a5f1-4127293260cc'
		},

		alreadyVoted: {
			message: 'You have already voted.',
			code: 'ALREADY_VOTED',
			id: '0963fc77-efac-419b-9424-b391608dc6d8'
		},

		alreadyExpired: {
			message: 'The poll is already expired.',
			code: 'ALREADY_EXPIRED',
			id: '1022a357-b085-4054-9083-8f8de358337e'
		},
	}
};

export default define(meta, async (ps, user) => {
	const createdAt = new Date();

	// Get votee
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	if (!note.hasPoll) {
		throw new ApiError(meta.errors.noPoll);
	}

	const poll = await Polls.findOneOrFail({ noteId: note.id });

	if (poll.expiresAt && poll.expiresAt < createdAt) {
		throw new ApiError(meta.errors.alreadyExpired);
	}

	if (poll.choices[ps.choice] == null) {
		throw new ApiError(meta.errors.invalidChoice);
	}

	// if already voted
	const exist = await PollVotes.find({
		noteId: note.id,
		userId: user.id
	});

	if (exist.length) {
		if (poll.multiple) {
			if (exist.some(x => x.choice == ps.choice))
				throw new ApiError(meta.errors.alreadyVoted);
		} else {
			throw new ApiError(meta.errors.alreadyVoted);
		}
	}

	// Create vote
	const vote = await PollVotes.save({
		id: genId(),
		createdAt,
		noteId: note.id,
		userId: user.id,
		choice: ps.choice
	});

	// Increment votes count
	const index = ps.choice + 1; // In SQL, array index is 1 based
	await Polls.query(`UPDATE poll SET votes[${index}] = votes[${index}] + 1 WHERE "noteId" = '${poll.noteId}'`);

	publishNoteStream(note.id, 'pollVoted', {
		choice: ps.choice,
		userId: user.id
	});

	// Notify
	createNotification(note.userId, 'pollVote', {
		notifierId: user.id,
		noteId: note.id,
		choice: ps.choice
	});

	// Fetch watchers
	NoteWatchings.find({
		noteId: note.id,
		userId: Not(user.id),
	}).then(watchers => {
		for (const watcher of watchers) {
			createNotification(watcher.userId, 'pollVote', {
				notifierId: user.id,
				noteId: note.id,
				choice: ps.choice
			});
		}
	});

	// リモート投票の場合リプライ送信
	if (note.userHost != null) {
		const pollOwner = await Users.findOneOrFail(note.userId) as IRemoteUser;

		deliver(user, renderActivity(await renderVote(user, vote, note, poll, pollOwner)), pollOwner.inbox);
	}

	// リモートフォロワーにUpdate配信
	deliverQuestionUpdate(note.id);
});
