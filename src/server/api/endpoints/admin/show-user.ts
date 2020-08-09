import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { Users } from '../../../../models';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーの情報を取得します。',
	},

	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		userId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象のユーザーID',
				'en-US': 'The user ID which you want to suspend'
			}
		},
	}
};

export default define(meta, async (ps, me) => {
	const user = await Users.findOne(ps.userId as string);

	if (user == null) {
		throw new Error('user not found');
	}

	if ((me.isModerator && !me.isAdmin) && user.isAdmin) {
		throw new Error('cannot show info of admin');
	}

	return {
		...user,
		token: user.token != null ? "<MASKED>" : user.token,
	};
});
