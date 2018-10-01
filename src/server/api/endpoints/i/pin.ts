import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import User, { ILocalUser } from '../../../../models/user';
import Note from '../../../../models/note';
import { pack } from '../../../../models/user';
import { deliverPinnedChange } from '../../../../services/i/pin';
import getParams from '../../get-params';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿をピン留めします。'
	},

	requireCredential: true,

	kind: 'account-write',

	params: {
		noteId: $.type(ID).note({
			desc: {
				'ja-JP': '対象の投稿のID'
			}
		})
	}
};

export default async (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// Fetch pinee
	const note = await Note.findOne({
		_id: ps.noteId,
		userId: user._id
	});

	if (note === null) {
		return rej('note not found');
	}

	const pinnedNoteIds = user.pinnedNoteIds || [];

	if (pinnedNoteIds.length > 5) {
		return rej('cannot pin more notes');
	}

	if (pinnedNoteIds.some(id => id.equals(note._id))) {
		return rej('already exists');
	}

	pinnedNoteIds.unshift(note._id);

	await User.update(user._id, {
		$set: {
			pinnedNoteIds: pinnedNoteIds
		}
	});

	const iObj = await pack(user, user, {
		detail: true
	});

	// Send response
	res(iObj);

	// Send Add to followers
	deliverPinnedChange(user._id, note._id, true);
});
