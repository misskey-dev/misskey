import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import { removePinned } from '@/services/i/pin';
import define from '../../define';
import { ApiError } from '../../error';
import { Users } from '@/models/index';

export const meta = {
	tags: ['account', 'notes'],

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
			id: '454170ce-9d63-4a43-9da1-ea10afe81e21',
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'User',
	},
};

export default define(meta, async (ps, user) => {
	await removePinned(user, ps.noteId).catch(e => {
		if (e.id === 'b302d4cf-c050-400a-bbb3-be208681f40c') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	return await Users.pack(user.id, user, {
		detail: true,
	});
});
