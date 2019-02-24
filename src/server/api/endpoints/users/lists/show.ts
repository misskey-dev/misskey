import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import UserList, { pack } from '../../../../../models/user-list';
import define from '../../../define';
import { ApiError } from '../../../error';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストの情報を取得します。',
		'en-US': 'Show a user list.'
	},

	tags: ['lists', 'account'],

	requireCredential: true,

	kind: 'account-read',

	params: {
		listId: {
			validator: $.type(ID),
			transform: transform,
		},
	},

	res: {
		type: 'UserList'
	},

	errors: {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '7bc05c21-1d7a-41ae-88f1-66820f4dc686'
		},
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

	return await pack(userList);
});
