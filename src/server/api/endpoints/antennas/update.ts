import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { Antennas, UserLists } from '../../../../models';

export const meta = {
	tags: ['antennas'],

	requireCredential: true,

	kind: 'write:account',

	params: {
		antennaId: {
			validator: $.type(ID),
		},

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
		noSuchAntenna: {
			message: 'No such antenna.',
			code: 'NO_SUCH_ANTENNA',
			id: '10c673ac-8852-48eb-aa1f-f5b67f069290'
		},

		noSuchUserList: {
			message: 'No such user list.',
			code: 'NO_SUCH_USER_LIST',
			id: '1c6b35c9-943e-48c2-81e4-2844989407f7'
		}
	}
};

export default define(meta, async (ps, user) => {
	// Fetch the antenna
	const antenna = await Antennas.findOne({
		id: ps.antennaId,
		userId: user.id
	});

	if (antenna == null) {
		throw new ApiError(meta.errors.noSuchAntenna);
	}

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

	await Antennas.update(antenna.id, {
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

	return await Antennas.pack(antenna.id);
});
