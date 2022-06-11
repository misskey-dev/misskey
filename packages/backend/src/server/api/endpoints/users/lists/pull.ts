import { publishUserListStream } from '@/services/stream.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { getUser } from '../../../common/getters.js';
import { UserLists, UserListJoinings, Users } from '@/models/index.js';

export const meta = {
	tags: ['lists', 'users'],

	requireCredential: true,

	kind: 'write:account',

	description: 'Remove a user from a list.',

	errors: {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '7f44670e-ab16-43b8-b4c1-ccd2ee89cc02',
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '588e7f72-c744-4a61-b180-d354e912bda2',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		listId: { type: 'string', format: 'misskey:id' },
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['listId', 'userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	// Fetch the list
	const userList = await UserLists.findOneBy({
		id: ps.listId,
		userId: me.id,
	});

	if (userList == null) {
		throw new ApiError(meta.errors.noSuchList);
	}

	// Fetch the user
	const user = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
		throw e;
	});

	// Pull the user
	await UserListJoinings.delete({ userListId: userList.id, userId: user.id });

	publishUserListStream(userList.id, 'userRemoved', await Users.pack(user));
});
