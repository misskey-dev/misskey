import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import UserList from '../../../../../models/user-list';
import { pack as packUser, isRemoteUser, fetchProxyAccount } from '../../../../../models/user';
import { publishUserListStream } from '../../../../../services/stream';
import { renderActivity } from '../../../../../remote/activitypub/renderer';
import renderFollow from '../../../../../remote/activitypub/renderer/follow';
import { deliver } from '../../../../../queue';
import define from '../../../define';
import { ApiError } from '../../../error';
import { getUser } from '../../../common/getters';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストに指定したユーザーを追加します。',
		'en-US': 'Add a user to a user list.'
	},

	tags: ['lists', 'users'],

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
	},

	errors: {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '2214501d-ac96-4049-b717-91e42272a711'
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'a89abd3d-f0bc-4cce-beb1-2f446f4f1e6a'
		},

		alreadyAdded: {
			message: 'That user has already been added to that list.',
			code: 'ALREADY_ADDED',
			id: '1de7c884-1595-49e9-857e-61f12f4d4fc5'
		}
	}
};

export default define(meta, async (ps, me) => {
	// Fetch the list
	const userList = await UserList.findOne({
		_id: ps.listId,
		userId: me._id,
	});

	if (userList == null) {
		throw new ApiError(meta.errors.noSuchList);
	}

	// Fetch the user
	const user = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
		throw e;
	});

	if (userList.userIds.map(id => id.toHexString()).includes(user._id.toHexString())) {
		throw new ApiError(meta.errors.alreadyAdded);
	}

	// Push the user
	await UserList.update({ _id: userList._id }, {
		$push: {
			userIds: user._id
		}
	});

	publishUserListStream(userList._id, 'userAdded', await packUser(user));

	// このインスタンス内にこのリモートユーザーをフォローしているユーザーがいなくても投稿を受け取るためにダミーのユーザーがフォローしたということにする
	if (isRemoteUser(user)) {
		const proxy = await fetchProxyAccount();
		const content = renderActivity(renderFollow(proxy, user));
		deliver(proxy, content, user.inbox);
	}
});
