import define from '../../../define';
import { ApiError } from '../../../error';
import { UserLists } from '@/models/index';

export const meta = {
	tags: ['lists'],

	requireCredential: true,

	kind: 'write:account',

	params: {
		type: 'object',
		properties: {
			listId: { type: 'string', format: 'misskey:id', },
			name: { type: 'string', minLength: 1, maxLength: 100, },
		},
		required: ['listId', 'name'],
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'UserList',
	},

	errors: {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '796666fe-3dff-4d39-becb-8a5932c1d5b7',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	// Fetch the list
	const userList = await UserLists.findOne({
		id: ps.listId,
		userId: user.id,
	});

	if (userList == null) {
		throw new ApiError(meta.errors.noSuchList);
	}

	await UserLists.update(userList.id, {
		name: ps.name,
	});

	return await UserLists.pack(userList.id);
});
