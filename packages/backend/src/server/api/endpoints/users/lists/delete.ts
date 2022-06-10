import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { UserLists } from '@/models/index.js';

export const meta = {
	tags: ['lists'],

	requireCredential: true,

	kind: 'write:account',

	description: 'Delete an existing list of users.',

	errors: {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '78436795-db79-42f5-b1e2-55ea2cf19166',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		listId: { type: 'string', format: 'misskey:id' },
	},
	required: ['listId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const userList = await UserLists.findOneBy({
		id: ps.listId,
		userId: user.id,
	});

	if (userList == null) {
		throw new ApiError(meta.errors.noSuchList);
	}

	await UserLists.delete(userList.id);
});
