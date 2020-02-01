import $ from 'cafy';
import define from '../../define';
import { genId } from '../../../../misc/gen-id';
import { Antennas, UserLists } from '../../../../models';
import { ID } from '../../../../misc/cafy-id';
import { ApiError } from '../../error';

export const meta = {
	tags: ['antennas'],

	requireCredential: true,

	kind: 'write:account',

	params: {
		name: {
			validator: $.str.range(1, 100)
		},

		src: {
			validator: $.str.or(['home', 'all', 'users', 'list'])
		},

		userListId: {
			validator: $.nullable.optional.type(ID),
		},

		keywords: {
			validator: $.arr($.arr($.str))
		},

		users: {
			validator: $.arr($.str)
		},

		caseSensitive: {
			validator: $.bool
		},

		withReplies: {
			validator: $.bool
		},

		withFile: {
			validator: $.bool
		},

		notify: {
			validator: $.bool
		}
	},

	errors: {
		noSuchUserList: {
			message: 'No such user list.',
			code: 'NO_SUCH_USER_LIST',
			id: '95063e93-a283-4b8b-9aa5-bcdb8df69a7f'
		}
	}
};

export default define(meta, async (ps, user) => {
	let userList;

	if (ps.src === 'list') {
		userList = await UserLists.findOne({
			id: ps.userListId,
			userId: user.id,
		});
	
		if (userList == null) {
			throw new ApiError(meta.errors.noSuchUserList);
		}
	}

	const antenna = await Antennas.save({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		name: ps.name,
		src: ps.src,
		userListId: userList ? userList.id : null,
		keywords: ps.keywords,
		users: ps.users,
		caseSensitive: ps.caseSensitive,
		withReplies: ps.withReplies,
		withFile: ps.withFile,
		notify: ps.notify,
	});

	return await Antennas.pack(antenna);
});
