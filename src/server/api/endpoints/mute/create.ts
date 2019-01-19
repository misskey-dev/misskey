import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import User from '../../../../models/user';
import Mute from '../../../../models/mute';
import define from '../../define';
import { errorWhen } from '../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': 'ユーザーをミュートします。',
		'en-US': 'Mute a user'
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
	.then(async x => {
		if (x === null) throw 'user not found';
		if (await Mute.findOne({
			muterId: user._id,
			muteeId: x._id
		}) !== null) throw 'already muting';
		await Mute.insert({
			createdAt: new Date(),
			muterId: user._id,
			muteeId: x._id,
		});
	}));
