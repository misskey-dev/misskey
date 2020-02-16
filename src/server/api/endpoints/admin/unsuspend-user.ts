import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { Users } from '../../../../models';
import { insertModerationLog } from '../../../../services/insert-moderation-log';
import { doPostUnsuspend } from '../../../../services/unsuspend-user';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーの凍結を解除します。',
		'en-US': 'Unsuspend a user.'
	},

	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		userId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象のユーザーID',
				'en-US': 'The user ID which you want to unsuspend'
			}
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
