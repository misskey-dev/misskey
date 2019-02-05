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

export const meta = {
	desc: {
		'ja-JP': '指定した投稿のアンケートに投票します。',
		'en-US': 'Vote poll of a note.'
	},

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
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Get votee
	const note = await Note.findOne({
		_id: ps.noteId
	});

	if (note === null) {
		return rej('note not found');
	}

	if (note.poll == null) {
		return rej('poll not found');
	}

	if (!note.poll.choices.some(x => x.id == ps.choice)) return rej('invalid choice param');

	// if already voted
	const exist = await Vote.findOne({
		noteId: note._id,
		userId: user._id
	});

	if (exist !== null) {
		return rej('already voted');
	}

	// Create vote
	await Vote.insert({
		createdAt: new Date(),
		noteId: note._id,
		userId: user._id,
		choice: ps.choice
	});

	// Send response
	res();

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
			createdAt: new Date(),
			text: ps.choice.toString(),
			reply: note,
			visibility: 'specified',
			visibleUsers: [ pollOwner ],
		});
	}
}));
