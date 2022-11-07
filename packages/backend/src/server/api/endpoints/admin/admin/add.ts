import define from '../../../define.js';
import { Users } from '@/models/index.js';
import { publishInternalEvent } from '@/services/stream.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	const user = await Users.findOneBy({ id: ps.userId });

	if (user == null) {
		throw new Error('user not found');
	}

	if (user.isModerator) {
		throw new Error('cannot mark as admin if moderator user');
	}

	await Users.update(user.id, {
		isAdmin: true,
	});

	publishInternalEvent('userChangeAdminState', { id: user.id, isAdmin: true });
});
