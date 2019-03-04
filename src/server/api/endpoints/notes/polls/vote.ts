import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import Vote from '../../../../../models/poll-vote';
import Note from '../../../../../models/note';
import Watching from '../../../../../models/note-watching';
import watch from '../../../../../services/note/watch';
import { publishNoteStream } from '../../../../../services/stream';
import notify from '../../../../../services/create-notification';
import define from '../../../define';
import createNote from '../../../../../services/note/create';
import User from '../../../../../models/user';
import { ApiError } from '../../../error';
import { getNote } from '../../../common/getters';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿のアンケートに投票します。',
		'en-US': 'Vote poll of a note.'
	},

	tags: ['notes'],

	requireCredential: true,

	kind: 'vote-write',

	params: {
		noteId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象の投稿のID',
				'en-US': 'Target note ID'
			}
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

	if (note.poll == null) {
		throw new ApiError(meta.errors.noPoll);
	}

	if (note.poll.expiresAt && note.poll.expiresAt < createdAt) {
		throw new ApiError(meta.errors.alreadyExpired);
	}

	if (!note.poll.choices.some(x => x.id == ps.choice)) {
		throw new ApiError(meta.errors.invalidChoice);
	}

	// if already voted
	const exist = await Vote.find({
		noteId: note._id,
		userId: user._id
	});

	if (exist.length) {
		if (note.poll.multiple) {
			if (~exist.findIndex(x => x.choice == ps.choice))
				throw new ApiError(meta.errors.alreadyVoted);
		} else {
			throw new ApiError(meta.errors.alreadyVoted);
		}
	}

	// Create vote
	await Vote.insert({
		createdAt,
		noteId: note._id,
		userId: user._id,
		choice: ps.choice
	});

	const inc: any = {};
	inc[`poll.choices.${note.poll.choices.findIndex(c => c.id == ps.choice)}.votes`] = 1;

	// Increment votes count
	await Note.update({ _id: note._id }, {
		$inc: inc
	});

	publishNoteStream(note._id, 'pollVoted', {
		choice: ps.choice,
		userId: user._id.toHexString()
	});

	// Notify
	notify(note.userId, user._id, 'poll_vote', {
		noteId: note._id,
		choice: ps.choice
	});

	// Fetch watchers
	Watching
		.find({
			noteId: note._id,
			userId: { $ne: user._id },
			// 削除されたドキュメントは除く
			deletedAt: { $exists: false }
		}, {
			fields: {
				userId: true
			}
		})
		.then(watchers => {
			for (const watcher of watchers) {
				notify(watcher.userId, user._id, 'poll_vote', {
					noteId: note._id,
					choice: ps.choice
				});
			}
		});

	// この投稿をWatchする
	if (user.settings.autoWatch !== false) {
		watch(user._id, note);
	}

	// リモート投票の場合リプライ送信
	if (note._user.host != null) {
		const pollOwner = await User.findOne({
			_id: note.userId
		});

		createNote(user, {
			createdAt,
			text: ps.choice.toString(),
			reply: note,
			visibility: 'specified',
			visibleUsers: [pollOwner],
			voting: true
		});
	}

	return;
});
