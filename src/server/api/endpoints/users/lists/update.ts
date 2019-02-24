import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import UserList, { pack } from '../../../../../models/user-list';
import define from '../../../define';
import { ApiError } from '../../../error';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストを更新します。',
		'en-US': 'Update a user list'
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
		},

		title: {
			validator: $.str.range(1, 100),
			desc: {
				'ja-JP': 'このユーザーリストの名前',
				'en-US': 'name of this user list'
			}
		}
	},

	errors: {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '796666fe-3dff-4d39-becb-8a5932c1d5b7'
		},
	}
};

export default define(meta, async (ps, user) => {
	// Fetch the list
	const userList = await UserList.findOne({
		_id: ps.listId,
		userId: user._id
	});

	if (userList == null) {
		throw new ApiError(meta.errors.noSuchList);
	}

	await UserList.update({ _id: userList._id }, {
		$set: {
			title: ps.title
		}
	});

	return await pack(userList._id);
});
