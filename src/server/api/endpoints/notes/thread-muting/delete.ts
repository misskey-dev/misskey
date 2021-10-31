import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { getNote } from '../../../common/getters';
import { ApiError } from '../../../error';
import { NoteThreadMutings } from '@/models';

export const meta = {
	tags: ['notes'],

	requireCredential: true as const,

	kind: 'write:account',

	params: {
		noteId: {
			validator: $.type(ID),
		}
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'bddd57ac-ceb3-b29d-4334-86ea5fae481a'
		}
	}
};

export default define(meta, async (ps, user) => {
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	await NoteThreadMutings.delete({
		threadId: note.threadId || note.id,
		userId: user.id,
	});
});
