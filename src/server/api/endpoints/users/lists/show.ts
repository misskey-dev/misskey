import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import UserList, { pack } from '../../../../../models/user-list';
import define from '../../../define';
import { error } from '../../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストの情報を取得します。',
		'en-US': 'Show a user list.'
	},

	requireCredential: true,

	kind: 'account-read',

	params: {
		listId: {
			validator: $.type(ID),
			transform: transform,
		},
	}
};

export default define(meta, (ps, me) => UserList.findOne({
		_id: ps.listId,
		userId: me._id,
	})
	.then(x =>
		!x ? error('list not found') :
		pack(x)));
