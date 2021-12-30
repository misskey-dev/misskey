import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import createReaction from '@/services/note/reaction/create';
import define from '../../../define';
import { getNote } from '../../../common/getters';
import { ApiError } from '../../../error';

export const meta = {
	tags: ['reactions', 'notes'],

	requireCredential: true as const,

	kind: 'write:reactions',

	params: {
		noteId: {
			validator: $.type(ID),
		},

		reaction: {
			validator: $.str,
		},
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '033d0620-5bfe-4027-965d-980b0c85a3ea',
		},

		alreadyReacted: {
			message: 'You are already reacting to that note.',
			code: 'ALREADY_REACTED',
			id: '71efcf98-86d6-4e2b-b2ad-9d032369366b',
		},

		youHaveBeenBlocked: {
			message: 'You cannot react this note because you have been blocked by this user.',
			code: 'YOU_HAVE_BEEN_BLOCKED',
			id: '20ef5475-9f38-4e4c-bd33-de6d979498ec',
		},
	},
};

export default define(meta, async (ps, user) => {
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});
	await createReaction(user, note, ps.reaction).catch(e => {
		if (e.id === '51c42bb4-931a-456b-bff7-e5a8a70dd298') throw new ApiError(meta.errors.alreadyReacted);
		if (e.id === 'e70412a4-7197-4726-8e74-f3e0deb92aa7') throw new ApiError(meta.errors.youHaveBeenBlocked);
		throw e;
	});
	return;
});
