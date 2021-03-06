import $ from 'cafy';
import { ID } from '../../../../../misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { UserLists } from '../../../../../models';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストを更新します。',
		'en-US': 'Update a user list'
	},

	tags: ['lists'],

	requireCredential: true as const,

	kind: 'write:account',

	params: {
		listId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象となるユーザーリストのID',
				'en-US': 'ID of target user list'
			}
		},

		name: {
			validator: $.str.range(1, 100),
			desc: {
				'ja-JP': 'このユーザーリストの名前',
				'en-US': 'name of this user list'
			}
		}
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'UserList',
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
	const userList = await UserLists.findOne({
		id: ps.listId,
		userId: user.id
	});

	if (userList == null) {
		throw new ApiError(meta.errors.noSuchList);
	}

	await UserLists.update(userList.id, {
		name: ps.name
	});

	return await UserLists.pack(userList.id);
});
