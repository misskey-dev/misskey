import define from '../../define.js';
import { Users } from '@/models/index.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	res: {
		type: 'object',
		nullable: false, optional: false,
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
export default define(meta, paramDef, async (ps, me) => {
	const user = await Users.findOneBy({ id: ps.userId });

	if (user == null) {
		throw new Error('user not found');
	}

	const _me = await Users.findOneByOrFail({ id: me.id });
	if ((_me.isModerator && !_me.isAdmin) && user.isAdmin) {
		throw new Error('cannot show info of admin');
	}

	return {
		...user,
		token: user.token != null ? '<MASKED>' : user.token,
	};
});
