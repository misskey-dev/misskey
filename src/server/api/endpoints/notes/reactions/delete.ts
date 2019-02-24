import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import define from '../../../define';
import * as ms from 'ms';
import deleteReaction from '../../../../../services/note/reaction/delete';
import { getNote } from '../../../common/getters';
import { ApiError } from '../../../error';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿へのリアクションを取り消します。',
		'en-US': 'Unreact to a note.'
	},

	tags: ['reactions', 'notes'],

	requireCredential: true,

	kind: 'reaction-write',

	limit: {
		duration: ms('1hour'),
		max: 5,
		minInterval: ms('3sec')
	},

	params: {
		noteId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象の投稿のID',
				'en-US': 'Target note ID'
			}
		},
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '764d9fce-f9f2-4a0e-92b1-6ceac9a7ad37'
		},

		notReacted: {
			message: 'You are not reacting to that note.',
			code: 'NOT_REACTED',
			id: '92f4426d-4196-4125-aa5b-02943e2ec8fc'
		},
	}
};

export default define(meta, async (ps, user) => {
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});
	await deleteReaction(user, note).catch(e => {
		if (e.id === '60527ec9-b4cb-4a88-a6bd-32d3ad26817d') throw new ApiError(meta.errors.notReacted);
		throw e;
	});
});
