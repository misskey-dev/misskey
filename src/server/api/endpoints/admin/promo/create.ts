import $ from 'cafy';
import { ID } from '../../../../../misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { getNote } from '../../../common/getters';
import { PromoNotes } from '../../../../../models';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		noteId: {
			validator: $.type(ID),
		},

		expiresAt: {
			validator: $.num.int()
		},
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'ee449fbe-af2a-453b-9cae-cf2fe7c895fc'
		},

		alreadyPromoted: {
			message: 'The note has already promoted.',
			code: 'ALREADY_PROMOTED',
			id: 'ae427aa2-7a41-484f-a18c-2c1104051604'
		},
	}
};

export default define(meta, async (ps, user) => {
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	const exist = await PromoNotes.findOne(note.id);

	if (exist != null) {
		throw new ApiError(meta.errors.alreadyPromoted);
	}

	await PromoNotes.save({
		noteId: note.id,
		createdAt: new Date(),
		expiresAt: new Date(ps.expiresAt),
		userId: note.userId,
	});
});
