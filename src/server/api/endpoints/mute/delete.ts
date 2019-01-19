import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import User from '../../../../models/user';
import Mute from '../../../../models/mute';
import define from '../../define';
import { error, errorWhen } from '../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': 'ユーザーのミュートを解除します。',
		'en-US': 'Unmute a user'
	},

	requireCredential: true,

	kind: 'account/write',

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		},
	}
};

export default define(meta, (ps, user) => errorWhen(
	user._id.equals(ps.userId),
	'mutee is yourself')
	.then(() => User.findOne({ _id: ps.userId }, {
			fields: {
				data: false,
				profile: false
			}
		}))
	.then(x =>
		x === null ? error('user not found') :
		Mute.findOne({
			muterId: user._id,
			muteeId: x._id
		}))
	.then(x =>
		x === null ? error('already not muting') :
		Mute.remove({ _id: x._id }))
	.then(() => {}));
