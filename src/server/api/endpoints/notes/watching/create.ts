import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import define from '../../../define';
import watch from '../../../../../services/note/watch';
import { getNote } from '../../../common/getters';
import { ApiError } from '../../../error';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定した投稿をウォッチします。',
		'en-US': 'Watch a note.'
	},

	tags: ['notes'],

	requireCredential: true,

	kind: 'account-write',

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
			id: 'ea0e37a6-90a3-4f58-ba6b-c328ca206fc7'
		}
	}
};

export default define(meta, async (ps, user) => {
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	await watch(user._id, note);
});
