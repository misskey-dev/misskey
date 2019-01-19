import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import define from '../../define';
import User, { IUser } from '../../../../models/user';
import { hash } from 'bcryptjs';
import rndstr from 'rndstr';
import { error } from '../../../../prelude/promise';

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

const update = async (user: IUser) => {
	const password = rndstr('a-zA-Z0-9', 8);
	await User.findOneAndUpdate({
		_id: user._id
	}, {
		$set: { password: await hash(password, 10) }
	});
	return { password };
};

export default define(meta, ps => User.findOne({ _id: ps.userId })
	.then(x =>
		!x ? error('user not found') :
		x.isAdmin ? error('cannot reset password of admin') :
		x)
	.then(update));
