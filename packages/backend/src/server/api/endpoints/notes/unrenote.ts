import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import deleteNote from '@/services/note/delete';
import define from '../../define';
import * as ms from 'ms';
import { getNote } from '../../common/getters';
import { ApiError } from '../../error';
import { Notes, Users } from '@/models/index';

export const meta = {
	tags: ['notes'],

	requireCredential: true as const,

	kind: 'write:notes',

	limit: {
		duration: ms('1hour'),
		max: 300,
		minInterval: ms('1sec')
	},

	params: {
		noteId: {
			validator: $.type(ID),
		}
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'efd4a259-2442-496b-8dd7-b255aa1a160f'
		},
	}
};

export default define(meta, async (ps, user) => {
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	const renotes = await Notes.find({
		userId: user.id,
		renoteId: note.id
	});

	for (const note of renotes) {
		deleteNote(await Users.findOneOrFail(user.id), note);
	}
});
