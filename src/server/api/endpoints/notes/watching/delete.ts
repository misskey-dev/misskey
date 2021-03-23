import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import unwatch from '../../../../../services/note/unwatch';
import { getNote } from '../../../common/getters';
import { ApiError } from '../../../error';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿のウォッチを解除します。',
		'en-US': 'Unwatch a note.'
	},

	tags: ['notes'],

	requireCredential: true as const,

	kind: 'write:account',

	params: {
		noteId: {
			validator: $.type(ID),
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
			id: '09b3695c-f72c-4731-a428-7cff825fc82e'
		}
	}
};

export default define(meta, async (ps, user) => {
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	await unwatch(user.id, note);
});
