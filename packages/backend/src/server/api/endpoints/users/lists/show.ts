import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { UserLists } from '@/models/index';

export const meta = {
	tags: ['lists', 'account'],

	requireCredential: true as const,

	kind: 'read:account',

	params: {
		listId: {
			validator: $.type(ID),
		},
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
			id: '7bc05c21-1d7a-41ae-88f1-66820f4dc686',
		},
	},
};

export default define(meta, async (ps, me) => {
	// Fetch the list
	const userList = await UserLists.findOne({
		id: ps.listId,
		userId: me.id,
	});

	if (userList == null) {
		throw new ApiError(meta.errors.noSuchList);
	}

	return await UserLists.pack(userList);
});
