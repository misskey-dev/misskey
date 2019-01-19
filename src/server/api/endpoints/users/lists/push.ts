import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import UserList from '../../../../../models/user-list';
import User, { pack as packUser, isRemoteUser, fetchProxyAccount } from '../../../../../models/user';
import { publishUserListStream } from '../../../../../stream';
import ap from '../../../../../remote/activitypub/renderer';
import renderFollow from '../../../../../remote/activitypub/renderer/follow';
import { deliver } from '../../../../../queue';
import define from '../../../define';
import { error } from '../../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストに指定したユーザーを追加します。',
		'en-US': 'Add a user to a user list.'
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
	})
	.then(x =>
		!x ? error('list not found') :
		User.findOne({ _id: ps.userId })
			.then(user =>
				!user ? error('user not found') :
				x.userIds.map(id => id.toHexString()).includes(user._id.toHexString()) ? error('the user already added') :
				UserList.update({ _id: x._id }, {
					$push: { userIds: user._id }
				})
				.then(() => (
					packUser(user).then(pack => publishUserListStream(x._id, 'userAdded', pack)),
					isRemoteUser(user) && fetchProxyAccount()
						.then(x => deliver(x, ap(renderFollow(x, user)), user.inbox))),
					undefined
				))));
