import $ from 'cafy';
import { ID } from '../../../../../misc/cafy-id';
import createReaction from '../../../../../services/note/reaction/create';
import define from '../../../define';
import { getNote } from '../../../common/getters';
import { ApiError } from '../../../error';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿にリアクションします。',
		'en-US': 'React to a note.'
	},

	tags: ['reactions', 'notes'],

	requireCredential: true as const,

	kind: 'write:reactions',

	params: {
		noteId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象の投稿'
			}
		},

		reaction: {
			validator: $.str,
			desc: {
				'ja-JP': 'リアクションの種類'
			}
		}
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '033d0620-5bfe-4027-965d-980b0c85a3ea'
		},

		isMyNote: {
			message: 'You can not react to your own notes.',
			code: 'IS_MY_NOTE',
			id: '7eeb9714-b047-43b5-b559-7b1b72810f53'
		},

		alreadyReacted: {
			message: 'You are already reacting to that note.',
			code: 'ALREADY_REACTED',
			id: '71efcf98-86d6-4e2b-b2ad-9d032369366b'
		}
	}
};

export default define(meta, async (ps, user) => {
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});
	await createReaction(user, note, ps.reaction).catch(e => {
		if (e.id === '2d8e7297-1873-4c00-8404-792c68d7bef0') throw new ApiError(meta.errors.isMyNote);
		if (e.id === '51c42bb4-931a-456b-bff7-e5a8a70dd298') throw new ApiError(meta.errors.alreadyReacted);
		throw e;
	});
	return;
});
