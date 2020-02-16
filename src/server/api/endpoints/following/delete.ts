import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import * as ms from 'ms';
import deleteFollowing from '../../../../services/following/delete';
import define from '../../define';
import { ApiError } from '../../error';
import { getUser } from '../../common/getters';
import { Followings, Users } from '../../../../models';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したユーザーのフォローを解除します。',
		'en-US': 'Unfollow a user.'
	},

	tags: ['following', 'users'],

	limit: {
		duration: ms('1hour'),
		max: 100
	},

	requireCredential: true as const,

	kind: 'write:following',

	params: {
		userId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		}
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '5b12c78d-2b28-4dca-99d2-f56139b42ff8'
		},

		followeeIsYourself: {
			message: 'Followee is yourself.',
			code: 'FOLLOWEE_IS_YOURSELF',
			id: 'd9e400b9-36b0-4808-b1d8-79e707f1296c'
		},

		notFollowing: {
			message: 'You are not following that user.',
			code: 'NOT_FOLLOWING',
			id: '5dbf82f5-c92b-40b1-87d1-6c8c0741fd09'
		},
	}
};

export default define(meta, async (ps, user) => {
	const follower = user;

	// Check if the followee is yourself
	if (user.id === ps.userId) {
		throw new ApiError(meta.errors.followeeIsYourself);
	}

	// Get followee
	const followee = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
		throw e;
	});

	// Check not following
	const exist = await Followings.findOne({
		followerId: follower.id,
		followeeId: followee.id
	});

	if (exist == null) {
		throw new ApiError(meta.errors.notFollowing);
	}

	await deleteFollowing(follower, followee);

	return await Users.pack(followee.id, user);
});
