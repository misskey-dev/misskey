import deleteNote from '@/services/note/delete.js';
import define from '../../define.js';
import ms from 'ms';
import { getNote } from '../../common/getters.js';
import { ApiError } from '../../error.js';
import { Users } from '@/models/index.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

	kind: 'write:notes',

	limit: {
		duration: ms('1hour'),
		max: 300,
		minInterval: ms('1sec'),
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '490be23f-8c1f-4796-819f-94cb4f9d1630',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: 'fe8d7103-0ea8-4ec3-814d-f8b401dc69e9',
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

	if ((!user.isAdmin && !user.isModerator) && (note.userId !== user.id)) {
		throw new ApiError(meta.errors.accessDenied);
	}

	// この操作を行うのが投稿者とは限らない(例えばモデレーター)ため
	await deleteNote(await Users.findOneByOrFail({ id: note.userId }), note);
});
