import ms from 'ms';
import deleteBlocking from '@/services/blocking/delete.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';
import { getUser } from '../../common/getters.js';
import { Blockings, Users } from '@/models/index.js';

export const meta = {
	tags: ['account'],

	limit: {
		duration: ms('1hour'),
		max: 100,
	},

	requireCredential: true,

	kind: 'write:blocks',

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
		type: 'object',
		optional: false, nullable: false,
		ref: 'UserDetailedNotMe',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const blocker = await Users.findOneByOrFail({ id: user.id });

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
	const exist = await Blockings.findOneBy({
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
