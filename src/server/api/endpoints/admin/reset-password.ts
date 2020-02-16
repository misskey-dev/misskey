import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import * as bcrypt from 'bcryptjs';
import rndstr from 'rndstr';
import { Users, UserProfiles } from '../../../../models';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーのパスワードをリセットします。',
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

export default define(meta, async (ps) => {
	const user = await Users.findOne(ps.userId as string);

	if (user == null) {
		throw new Error('user not found');
	}

	if (user.isAdmin) {
		throw new Error('cannot reset password of admin');
	}

	const passwd = rndstr('a-zA-Z0-9', 8);

	// Generate hash of password
	const hash = bcrypt.hashSync(passwd);

	await UserProfiles.update({
		userId: user.id
	}, {
		password: hash
	});

	return {
		password: passwd
	};
});
