import $ from 'cafy';
import { ID } from '@/misc/cafy-id.js';
import define from '../../define.js';
import { Users } from '@/models/index.js';
import { insertModerationLog } from '@/services/insert-moderation-log.js';
import { doPostUnsuspend } from '@/services/unsuspend-user.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		userId: {
			validator: $.type(ID),
		},
	}
};

export default define(meta, async (ps, me) => {
	const user = await Users.findOne(ps.userId as string);

	if (user == null) {
		throw new Error('user not found');
	}

	await Users.update(user.id, {
		isSuspended: false
	});

	insertModerationLog(me, 'unsuspend', {
		targetId: user.id,
	});

	doPostUnsuspend(user);
});
