import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import UserList from '../../../../../models/user-list';
import User, { pack as packUser } from '../../../../../models/user';
import { publishUserListStream } from '../../../../../stream';
import define from '../../../define';
import { error } from '../../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストから指定したユーザーを削除します。',
		'en-US': 'Remove a user to a user list.'
	},

	requireCredential: true,

	kind: 'account-write',

	params: {
		listId: {
			validator: $.type(ID),
			transform: transform,
		},

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

export default define(meta, (ps, me) => UserList.findOne({
		_id: ps.listId,
		userId: me._id,
	}).then(x =>
		(!x) ? error('list not found') :
		User.findOne({ _id: ps.userId })
			.then(user =>
				!user ? error('user not found') :
				UserList.update({ _id: x._id }, {
					$pull: { userIds: user._id }
				})
				.then(() => (packUser(user)
					.then(pack => publishUserListStream(x._id, 'userRemoved', pack)), undefined)))));
