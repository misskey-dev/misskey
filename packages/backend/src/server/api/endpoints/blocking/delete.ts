import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import ms from 'ms';
import deleteBlocking from '@/services/blocking/delete';
import define from '../../define';
import { ApiError } from '../../error';
import { getUser } from '../../common/getters';
import { Blockings, Users } from '@/models/index';

export const meta = {
	tags: ['account'],

	limit: {
		duration: ms('1hour'),
		max: 100,
	},

	requireCredential: true as const,

	kind: 'write:blocks',

	params: {
		userId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '8621d8bf-c358-4303-a066-5ea78610eb3f',
		},

		blockeeIsYourself: {
			message: 'Blockee is yourself.',
			code: 'BLOCKEE_IS_YOURSELF',
			id: '06f6fac6-524b-473c-a354-e97a40ae6eac',
		},

		notBlocking: {
			message: 'You are not blocking that user.',
			code: 'NOT_BLOCKING',
			id: '291b2efa-60c6-45c0-9f6a-045c8f9b02cd',
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'User',
	},
};

export default define(meta, async (ps, user) => {
	const blocker = await Users.findOneOrFail(user.id);

	// Check if the blockee is yourself
	if (user.id === ps.userId) {
		throw new ApiError(meta.errors.blockeeIsYourself);
	}

	// Get blockee
	const blockee = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
		throw e;
	});

	// Check not blocking
	const exist = await Blockings.findOne({
		blockerId: blocker.id,
		blockeeId: blockee.id,
	});

	if (exist == null) {
		throw new ApiError(meta.errors.notBlocking);
	}

	// Delete blocking
	await deleteBlocking(blocker, blockee);

	return await Users.pack(blockee.id, blocker, {
		detail: true,
	});
});
