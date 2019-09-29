import $ from 'cafy';
import { ID } from '../../../../../misc/cafy-id';
import define from '../../../define';
import { Users } from '../../../../../models';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーの管理者権限を剥奪します。',
		'en-US': 'Unmark a user as admin.'
	},

	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,

	params: {
		userId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象のユーザーID',
				'en-US': 'The user ID'
			}
		},
	}
};

export default define(meta, async (ps, i) => {
	const user = await Users.findOne(ps.userId as string);

	if (user == null) {
		throw new Error('user not found');
	}

	if (i.id === user.id) {
		throw new Error('you can\'t unmark yourself');
	}

	await Users.update(user.id, {
		isAdmin: false
	});
});
