import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import acceptFollowRequest from '../../../../../services/following/requests/accept';
import User from '../../../../../models/user';
import define from '../../../define';
import { ApiError } from '../../../error';

export const meta = {
	desc: {
		'ja-JP': '自分に届いた、指定したフォローリクエストを承認します。',
		'en-US': 'Accept a follow request.'
	},

	requireCredential: true,

	kind: 'following-write',

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
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
			id: '66ce1645-d66c-46bb-8b79-96739af885bd'
		},
	}
};

export default define(meta, async (ps, user) => {
	// Fetch follower
	const follower = await User.findOne({
		_id: ps.userId
	});

	if (follower === null) {
		throw new ApiError(meta.errors.noSuchUser);
	}

	await acceptFollowRequest(user, follower);

	return;
});
