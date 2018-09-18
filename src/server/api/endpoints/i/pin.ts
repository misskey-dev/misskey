import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import User, { ILocalUser } from '../../../../models/user';
import Note from '../../../../models/note';
import { pack } from '../../../../models/user';
import { deliverPinnedChange } from '../../../../services/i/pin';

/**
 * Pin note
 */
export default async (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'noteId' parameter
	const [noteId, noteIdErr] = $.type(ID).get(params.noteId);
	if (noteIdErr) return rej('invalid noteId param');

	// Fetch pinee
	const note = await Note.findOne({
		_id: noteId,
		userId: user._id
	});

	if (note === null) {
		return rej('note not found');
	}

	let addedId;
	let removedId;

	const pinnedNoteIds = user.pinnedNoteIds || [];

	if (pinnedNoteIds.some(id => id.equals(note._id))) {
		return rej('already exists');
	}

	pinnedNoteIds.unshift(note._id);
	addedId = note._id;

	if (pinnedNoteIds.length > 5) {
		removedId = pinnedNoteIds.pop();
	}

	await User.update(user._id, {
		$set: {
			pinnedNoteIds: pinnedNoteIds
		}
	});

	// Serialize
	const iObj = await pack(user, user, {
		detail: true
	});

	// Send Add/Remove to followers
	deliverPinnedChange(user._id, removedId, addedId);

	// Send response
	res(iObj);
});
