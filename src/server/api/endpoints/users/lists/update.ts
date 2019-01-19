import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import UserList, { pack } from '../../../../../models/user-list';
import define from '../../../define';
import { error } from '../../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストを更新します。',
		'en-US': 'Update a user list'
	},

	requireCredential: true,

	kind: 'account-write',

	params: {
		listId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象となるユーザーリストのID',
				'en-US': 'ID of target user list'
			}
		},

		title: {
			validator: $.str.range(1, 100),
			desc: {
				'ja-JP': 'このユーザーリストの名前',
				'en-US': 'name of this user list'
			}
		}
	}
};

export default define(meta, (ps, user) => UserList.findOne({
		_id: ps.listId,
		userId: user._id
	})
	.then(x =>
		!x ? error('list not found') :
		UserList.update({ _id: x._id }, {
			$set: { title: ps.title }
		})
		.then(() => pack(x._id))));
