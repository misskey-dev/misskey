import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { getNote } from '../../common/getters';
import { PromoReads } from '../../../../models';
import { genId } from '../../../../misc/gen-id';

export const meta = {
	desc: {
		'ja-JP': '指定したノートのプロモーションを既読にします。',
		'en-US': 'Marks the promotion for the specified note as read.'
	},

	tags: ['notes'],

	requireCredential: true as const,

	params: {
		noteId: {
			validator: $.type(ID),
		}
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'd785b897-fcd3-4fe9-8fc3-b85c26e6c932'
		},
	}
};

export default define(meta, async (ps, user) => {
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	const exist = await PromoReads.findOne({
		noteId: note.id,
		userId: user.id
	});

	if (exist != null) {
		return;
	}

	await PromoReads.save({
		id: genId(),
		createdAt: new Date(),
		noteId: note.id,
		userId: user.id
	});
});
