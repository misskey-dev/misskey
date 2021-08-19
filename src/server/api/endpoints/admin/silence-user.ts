import $ from 'cafy';
import { ID } from '@/misc/cafy-id.js';
import define from '../../define.js';
import { Users } from '@/models/index.js';
import { insertModerationLog } from '@/services/insert-moderation-log.js';

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

	if (user.isAdmin) {
		throw new Error('cannot silence admin');
	}

	await Users.update(user.id, {
		isSilenced: true
	});

	insertModerationLog(me, 'silence', {
		targetId: user.id,
	});
});
