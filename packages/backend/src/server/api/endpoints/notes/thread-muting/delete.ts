import define from '../../../define.js';
import { getNote } from '../../../common/getters.js';
import { ApiError } from '../../../error.js';
import { NoteThreadMutings } from '@/models/index.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

	kind: 'write:account',

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'bddd57ac-ceb3-b29d-4334-86ea5fae481a',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
	},
	required: ['noteId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	await NoteThreadMutings.delete({
		threadId: note.threadId || note.id,
		userId: user.id,
	});
});
