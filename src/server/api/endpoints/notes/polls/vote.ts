import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import Vote from '../../../../../models/poll-vote';
import Note from '../../../../../models/note';
import Watching from '../../../../../models/note-watching';
import watch from '../../../../../services/note/watch';
import { publishNoteStream } from '../../../../../stream';
import notify from '../../../../../notify';
import define from '../../../define';

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

export default define(meta, (ps, user) => Note.findOne({ _id: ps.noteId })
	.then(async x => {
		if (x === null) throw 'note not found';
		if (!x.poll) throw 'poll not found';
		if (!x.poll.choices.some(x => x.id == ps.choice)) throw 'invalid choice param';
		if (await Vote.findOne({
			noteId: x._id,
			userId: user._id
		}) !== null) throw 'already voted';
		await Vote.insert({
			createdAt: new Date(),
			noteId: x._id,
			userId: user._id,
			choice: ps.choice
		});
		Note.update({ _id: x._id }, {
			$inc: { [`poll.choices.${x.poll.choices.findIndex(x => x.id == ps.choice)}.votes`]: 1 }
		}).then(() => {
			publishNoteStream(x._id, 'pollVoted', {
				choice: ps.choice,
				userId: user._id.toHexString()
			});
			notify(x.userId, user._id, 'poll_vote', {
				noteId: x._id,
				choice: ps.choice
			});
			return Watching.find({
					noteId: x._id,
					userId: { $ne: user._id },
					deletedAt: { $exists: false }
				}, {
					fields: { userId: true }
				});
		}).then(watchers => {
			for (const watcher of watchers) notify(watcher.userId, user._id, 'poll_vote', {
					noteId: x._id,
					choice: ps.choice
				});
			if (user.settings.autoWatch !== false) watch(user._id, x);
		});
	}));
