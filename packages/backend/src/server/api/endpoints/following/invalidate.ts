import ms from 'ms';
import deleteFollowing from '@/services/following/delete.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';
import { getUser } from '../../common/getters.js';
import { Followings, Users } from '@/models/index.js';

export const meta = {
	tags: ['following', 'users'],

	limit: {
		duration: ms('1hour'),
		max: 100,
	},

	requireCredential: true,

	kind: 'write:following',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '5b12c78d-2b28-4dca-99d2-f56139b42ff8',
		},

		followerIsYourself: {
			message: 'Follower is yourself.',
			code: 'FOLLOWER_IS_YOURSELF',
			id: '07dc03b9-03da-422d-885b-438313707662',
		},

		notFollowing: {
			message: 'The other use is not following you.',
			code: 'NOT_FOLLOWING',
			id: '5dbf82f5-c92b-40b1-87d1-6c8c0741fd09',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'UserLite',
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
	const followee = user;

	// Check if the follower is yourself
	if (user.id === ps.userId) {
		throw new ApiError(meta.errors.followerIsYourself);
	}

	// Get follower
	const follower = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
		throw e;
	});

	// Check not following
	const exist = await Followings.findOneBy({
		followerId: follower.id,
		followeeId: followee.id,
	});

	if (exist == null) {
		throw new ApiError(meta.errors.notFollowing);
	}

	await deleteFollowing(follower, followee);

	return await Users.pack(followee.id, user);
});
