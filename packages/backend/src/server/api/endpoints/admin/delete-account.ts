import { Users } from '@/models/index.js';
import { deleteAccount } from '@/services/delete-account.js';
import define from '../../define.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,

	res: {
	},
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
	const user = await Users.findOneByOrFail({ id: ps.userId });
	if (user.isDeleted) {
		return;
	}

	await deleteAccount(user);
});
