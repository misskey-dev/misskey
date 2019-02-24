import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import UserList from '../../../../../models/user-list';
import define from '../../../define';
import { ApiError } from '../../../error';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストを削除します。',
		'en-US': 'Delete a user list'
	},

	tags: ['lists'],

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
	},

	errors: {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '78436795-db79-42f5-b1e2-55ea2cf19166'
		}
	}
};

export default define(meta, async (ps, user) => {
	const userList = await UserList.findOne({
		_id: ps.listId,
		userId: user._id
	});

	if (userList == null) {
		throw new ApiError(meta.errors.noSuchList);
	}

	await UserList.remove({
		_id: userList._id
	});
});
