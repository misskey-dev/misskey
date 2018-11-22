import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import define from '../../define';
import User from '../../../../models/user';
import * as bcrypt from 'bcryptjs';
import rndstr from 'rndstr';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーのパスワードをリセットします。',
	},

	requireCredential: true,
	requireModerator: true,

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーID',
				'en-US': 'The user ID which you want to suspend'
			}
		},
	}
};

export default define(meta, (ps) => new Promise(async (res, rej) => {
	const user = await User.findOne({
		_id: ps.userId
	});

	if (user == null) {
		return rej('user not found');
	}

	if (user.isAdmin) {
		return rej('cannot reset password of admin');
	}

	const passwd = rndstr('a-zA-Z0-9', 8);

	// Generate hash of password
	const hash = bcrypt.hashSync(passwd);

	await User.findOneAndUpdate({
		_id: user._id
	}, {
			$set: {
				password: hash
			}
		});

	res({
		password: passwd
	});
}));
