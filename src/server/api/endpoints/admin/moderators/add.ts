import $ from 'cafy';
import { StringID, NumericalID } from '../../../../../misc/cafy-id';
import define from '../../../define';
import { Users } from '../../../../../models';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーをモデレーターにします。',
		'en-US': 'Mark a user as moderator.'
	},

	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,

	params: {
		userId: {
			validator: $.type(StringID),
			desc: {
				'ja-JP': '対象のユーザーID',
				'en-US': 'The user ID'
			}
		},
	}
};

export default define(meta, async (ps) => {
	const user = await Users.findOne(ps.userId as string);

	if (user == null) {
		throw new Error('user not found');
	}

	await Users.update(user.id, {
		isModerator: true
	});
});
