import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import { pack } from '../../../../models/note';
import define from '../../define';
import { getNote } from '../../common/getters';
import { ApiError } from '../../error';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定した投稿を取得します。',
		'en-US': 'Get a note.'
	},

	tags: ['notes'],

	requireCredential: false,

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

	res: {
		type: 'Note',
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '24fcbfc6-2e37-42b6-8388-c29b3861a08d'
		}
	}
};

export default define(meta, async (ps, user) => {
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	return await pack(note, user, {
		detail: true
	});
});
