import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import UserList from '../../../../../models/user-list';
import User, { pack as packUser, isRemoteUser, fetchProxyAccount } from '../../../../../models/user';
import { publishUserListStream } from '../../../../../services/stream';
import { renderActivity } from '../../../../../remote/activitypub/renderer';
import renderFollow from '../../../../../remote/activitypub/renderer/follow';
import { deliver } from '../../../../../queue';
import define from '../../../define';

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

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
	// Fetch the list
	const userList = await UserList.findOne({
		_id: ps.listId,
		userId: me._id,
	});

	if (userList == null) {
		return rej('list not found');
	}

	// Fetch the user
	const user = await User.findOne({
		_id: ps.userId
	});

	if (user == null) {
		return rej('user not found');
	}

	if (userList.userIds.map(id => id.toHexString()).includes(user._id.toHexString())) {
		return rej('the user already added');
	}

	// Push the user
	await UserList.update({ _id: userList._id }, {
		$push: {
			userIds: user._id
		}
	});

	res();

	publishUserListStream(userList._id, 'userAdded', await packUser(user));

	// このインスタンス内にこのリモートユーザーをフォローしているユーザーがいなくても投稿を受け取るためにダミーのユーザーがフォローしたということにする
	if (isRemoteUser(user)) {
		const proxy = await fetchProxyAccount();
		const content = renderActivity(renderFollow(proxy, user));
		deliver(proxy, content, user.inbox);
	}
}));
