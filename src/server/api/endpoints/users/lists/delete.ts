import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import UserList from '../../../../../models/user-list';
import define from '../../../define';
import { error } from '../../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストを削除します。',
		'en-US': 'Delete a user list'
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
		}
	}
};

export default define(meta, (ps, user) => UserList.findOne({
		_id: ps.listId,
		userId: user._id
	})
	.then(x =>
		!x ? error('list not found') :
		UserList.remove({ _id: x._id }))
	.then(() => {}));
