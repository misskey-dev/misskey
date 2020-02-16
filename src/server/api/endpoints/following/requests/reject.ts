import $ from 'cafy';
import { ID } from '../../../../../misc/cafy-id';
import rejectFollowRequest from '../../../../../services/following/requests/reject';
import define from '../../../define';
import { ApiError } from '../../../error';
import { getUser } from '../../../common/getters';

export const meta = {
	desc: {
		'ja-JP': '自分に届いた、指定したフォローリクエストを拒否します。',
		'en-US': 'Reject a follow request.'
	},

	tags: ['following', 'account'],

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
			id: 'abc2ffa6-25b2-4380-ba99-321ff3a94555'
		},
	}
};

export default define(meta, async (ps, user) => {
	// Fetch follower
	const follower = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
		throw e;
	});

	await rejectFollowRequest(user, follower);

	return;
});
