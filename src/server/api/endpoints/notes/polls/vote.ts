/**
 * Module dependencies
 */
import $ from 'cafy';
import Vote from '../../../../../models/poll-vote';
import Note from '../../../../../models/note';
import Watching from '../../../../../models/note-watching';
import watch from '../../../../../services/note/watch';
import { publishNoteStream } from '../../../../../publishers/stream';
import notify from '../../../../../publishers/notify';

/**
 * Vote poll of a note
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'noteId' parameter
	const [noteId, noteIdErr] = $(params.noteId).id().$;
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
		$(params.choice).number()
			.pipe(c => note.poll.choices.some(x => x.id == c))
			.$;
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

	const inc = {};
	inc[`poll.choices.${findWithAttr(note.poll.choices, 'id', choice)}.votes`] = 1;

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

function findWithAttr(array, attr, value) {
	for (let i = 0; i < array.length; i += 1) {
		if (array[i][attr] === value) {
			return i;
		}
	}
	return -1;
}
