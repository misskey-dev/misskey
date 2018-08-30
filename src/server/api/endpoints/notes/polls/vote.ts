import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import Vote from '../../../../../models/poll-vote';
import Note from '../../../../../models/note';
import Watching from '../../../../../models/note-watching';
import watch from '../../../../../services/note/watch';
import { publishNoteStream } from '../../../../../stream';
import notify from '../../../../../notify';
import { ILocalUser } from '../../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿のアンケートに投票します。',
		'en-US': 'Vote poll of a note.'
	},

	requireCredential: true,

	kind: 'vote-write'
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'noteId' parameter
	const [noteId, noteIdErr] = $.type(ID).get(params.noteId);
	if (noteIdErr) return rej('invalid noteId param');

	// Get votee
	const note = await Note.findOne({
		_id: noteId
	});

	if (note === null) {
		return rej('note not found');
	}

	if (note.poll == null) {
		return rej('poll not found');
	}

	// Get 'choice' parameter
	const [choice, choiceError] =
		$.num
			.pipe(c => note.poll.choices.some(x => x.id == c))
			.get(params.choice);
	if (choiceError) return rej('invalid choice param');

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
		choice: choice
	});

	// Send response
	res();

	const inc: any = {};
	inc[`poll.choices.${note.poll.choices.findIndex(c => c.id == choice)}.votes`] = 1;

	// Increment votes count
	await Note.update({ _id: note._id }, {
		$inc: inc
	});

	publishNoteStream(note._id, 'poll_voted');

	// Notify
	notify(note.userId, user._id, 'poll_vote', {
		noteId: note._id,
		choice: choice
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
			watchers.forEach(watcher => {
				notify(watcher.userId, user._id, 'poll_vote', {
					noteId: note._id,
					choice: choice
				});
			});
		});

	// この投稿をWatchする
	if (user.settings.autoWatch !== false) {
		watch(user._id, note);
	}
});
