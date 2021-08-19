import $ from 'cafy';
import { ID } from '@/misc/cafy-id.js';
import define from '../../../define.js';
import watch from '@/services/note/watch.js';
import { getNote } from '../../../common/getters.js';
import { ApiError } from '../../../error.js';

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
			id: 'ea0e37a6-90a3-4f58-ba6b-c328ca206fc7'
		}
	}
};

export default define(meta, async (ps, user) => {
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	await watch(user.id, note);
});
