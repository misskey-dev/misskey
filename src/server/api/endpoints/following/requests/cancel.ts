import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import cancelFollowRequest from '../../../../../services/following/requests/cancel';
import { pack } from '../../../../../models/user';
import define from '../../../define';
import { ApiError } from '../../../error';
import { getUser } from '../../../common/getters';

export const meta = {
	desc: {
		'ja-JP': '自分が作成した、指定したフォローリクエストをキャンセルします。',
		'en-US': 'Cancel a follow request.'
	},

	tags: ['following', 'account'],

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
			id: '4e68c551-fc4c-4e46-bb41-7d4a37bf9dab'
		},

		followRequestNotFound: {
			message: 'Follow request not found.',
			code: 'FOLLOW_REQUEST_NOT_FOUND',
			id: '089b125b-d338-482a-9a09-e2622ac9f8d4'
		},
	}
};

export default define(meta, async (ps, user) => {
	// Fetch followee
	const followee = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
		throw e;
	});

	try {
		await cancelFollowRequest(followee, user);
	} catch (e) {
		if (e.id === '17447091-ce07-46dd-b331-c1fd4f15b1e7') throw new ApiError(meta.errors.followRequestNotFound);
		throw e;
	}

	return await pack(followee._id, user);
});
