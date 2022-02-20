import define from '../../define';
import { Users } from '@/models/index';
import { insertModerationLog } from '@/services/insert-moderation-log';
import { doPostUnsuspend } from '@/services/unsuspend-user';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
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
	const user = await Users.findOne(ps.userId as string);

	if (user == null) {
		throw new Error('user not found');
	}

	await Users.update(user.id, {
		isSuspended: false,
	});

	insertModerationLog(me, 'unsuspend', {
		targetId: user.id,
	});

	doPostUnsuspend(user);
});
