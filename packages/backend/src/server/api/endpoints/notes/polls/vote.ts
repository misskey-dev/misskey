import { publishNoteStream } from '@/services/stream.js';
import { createNotification } from '@/services/create-notification.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { getNote } from '../../../common/getters.js';
import { deliver } from '@/queue/index.js';
import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import renderVote from '@/remote/activitypub/renderer/vote.js';
import { deliverQuestionUpdate } from '@/services/note/polls/update.js';
import { PollVotes, NoteWatchings, Users, Polls, Blockings } from '@/models/index.js';
import { Not } from 'typeorm';
import { IRemoteUser } from '@/models/entities/user.js';
import { genId } from '@/misc/gen-id.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

	kind: 'write:votes',

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'ecafbd2e-c283-4d6d-aecb-1a0a33b75396',
		},

		noPoll: {
			message: 'The note does not attach a poll.',
			code: 'NO_POLL',
			id: '5f979967-52d9-4314-a911-1c673727f92f',
		},

		invalidChoice: {
			message: 'Choice ID is invalid.',
			code: 'INVALID_CHOICE',
			id: 'e0cc9a04-f2e8-41e4-a5f1-4127293260cc',
		},

		alreadyVoted: {
			message: 'You have already voted.',
			code: 'ALREADY_VOTED',
			id: '0963fc77-efac-419b-9424-b391608dc6d8',
		},

		alreadyExpired: {
			message: 'The poll is already expired.',
			code: 'ALREADY_EXPIRED',
			id: '1022a357-b085-4054-9083-8f8de358337e',
		},

		youHaveBeenBlocked: {
			message: 'You cannot vote this poll because you have been blocked by this user.',
			code: 'YOU_HAVE_BEEN_BLOCKED',
			id: '85a5377e-b1e9-4617-b0b9-5bea73331e49',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		choice: { type: 'integer' },
	},
	required: ['noteId', 'choice'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const createdAt = new Date();

	// Get votee
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	if (!note.hasPoll) {
		throw new ApiError(meta.errors.noPoll);
	}

	// Check blocking
	if (note.userId !== user.id) {
		const block = await Blockings.findOneBy({
			blockerId: note.userId,
			blockeeId: user.id,
		});
		if (block) {
			throw new ApiError(meta.errors.youHaveBeenBlocked);
		}
	}

	const poll = await Polls.findOneByOrFail({ noteId: note.id });

	if (poll.expiresAt && poll.expiresAt < createdAt) {
		throw new ApiError(meta.errors.alreadyExpired);
	}

	if (poll.choices[ps.choice] == null) {
		throw new ApiError(meta.errors.invalidChoice);
	}

	// if already voted
	const exist = await PollVotes.findBy({
		noteId: note.id,
		userId: user.id,
	});

	if (exist.length) {
		if (poll.multiple) {
			if (exist.some(x => x.choice === ps.choice)) {
				throw new ApiError(meta.errors.alreadyVoted);
			}
		} else {
			throw new ApiError(meta.errors.alreadyVoted);
		}
	}

	// Create vote
	const vote = await PollVotes.insert({
		id: genId(),
		createdAt,
		noteId: note.id,
		userId: user.id,
		choice: ps.choice,
	}).then(x => PollVotes.findOneByOrFail(x.identifiers[0]));

	// Increment votes count
	const index = ps.choice + 1; // In SQL, array index is 1 based
	await Polls.query(`UPDATE poll SET votes[${index}] = votes[${index}] + 1 WHERE "noteId" = '${poll.noteId}'`);

	publishNoteStream(note.id, 'pollVoted', {
		choice: ps.choice,
		userId: user.id,
	});

	// Notify
	createNotification(note.userId, 'pollVote', {
		notifierId: user.id,
		noteId: note.id,
		choice: ps.choice,
	});

	// Fetch watchers
	NoteWatchings.findBy({
		noteId: note.id,
		userId: Not(user.id),
	}).then(watchers => {
		for (const watcher of watchers) {
			createNotification(watcher.userId, 'pollVote', {
				notifierId: user.id,
				noteId: note.id,
				choice: ps.choice,
			});
		}
	});

	// リモート投票の場合リプライ送信
	if (note.userHost != null) {
		const pollOwner = await Users.findOneByOrFail({ id: note.userId }) as IRemoteUser;

		deliver(user, renderActivity(await renderVote(user, vote, note, poll, pollOwner)), pollOwner.inbox);
	}

	// リモートフォロワーにUpdate配信
	deliverQuestionUpdate(note.id);
});
