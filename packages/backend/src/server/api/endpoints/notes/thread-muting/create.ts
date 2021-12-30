import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { getNote } from '../../../common/getters';
import { ApiError } from '../../../error';
import { Notes, NoteThreadMutings } from '@/models';
import { genId } from '@/misc/gen-id';
import readNote from '@/services/note/read';

export const meta = {
	tags: ['notes'],

	requireCredential: true as const,

	kind: 'write:account',

	params: {
		noteId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '5ff67ada-ed3b-2e71-8e87-a1a421e177d2',
		},
	},
};

export default define(meta, async (ps, user) => {
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	const mutedNotes = await Notes.find({
		where: [{
			id: note.threadId || note.id,
		}, {
			threadId: note.threadId || note.id,
		}],
	});

	await readNote(user.id, mutedNotes);

	await NoteThreadMutings.insert({
		id: genId(),
		createdAt: new Date(),
		threadId: note.threadId || note.id,
		userId: user.id,
	});
});
