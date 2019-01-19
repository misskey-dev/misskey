import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import define from '../../define';
import User from '../../../../models/user';
import AbuseUserReport from '../../../../models/abuse-user-report';
import { error } from '../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーを迷惑なユーザーであると報告します。'
	},

	requireCredential: true,

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		},

		comment: {
			validator: $.str.range(1, 3000),
			desc: {
				'ja-JP': '迷惑行為の詳細'
			}
		},
	}
};

export default define(meta, (ps, me) => User.findOne({ _id: ps.userId }, {
			fields: { _id: true }
		})
	.then(x =>
		x === null ? error('user not found') :
		x._id.equals(me._id) ? error('cannot report yourself') :
		x.isAdmin ? error('cannot report admin') :
		AbuseUserReport.insert({
			createdAt: new Date(),
			userId: x._id,
			reporterId: me._id,
			comment: ps.comment
		}))
	.then(() => {}));
