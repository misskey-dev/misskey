import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import deleteNote from '../../../../services/note/delete';
import User from '../../../../models/user';
import define from '../../define';
import * as ms from 'ms';
import { getNote } from '../../common/getters';
import { ApiError } from '../../error';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定した投稿を削除します。',
		'en-US': 'Delete a note.'
	},

	tags: ['notes'],

	requireCredential: true,

	kind: 'note-write',

	limit: {
		duration: ms('1hour'),
		max: 300,
		minInterval: ms('1sec')
	},

	params: {
		noteId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象の投稿のID',
				'en-US': 'Target note ID.'
			}
		}
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '490be23f-8c1f-4796-819f-94cb4f9d1630'
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: 'fe8d7103-0ea8-4ec3-814d-f8b401dc69e9'
		}
	}
};

export default define(meta, async (ps, user) => {
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	if (!user.isAdmin && !user.isModerator && !note.userId.equals(user._id)) {
		throw new ApiError(meta.errors.accessDenied);
	}

	await deleteNote(await User.findOne({ _id: note.userId }), note);
});
