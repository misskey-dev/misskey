import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import acceptFollowRequest from '../../../../../services/following/requests/accept';
import define from '../../../define';
import { ApiError } from '../../../error';
import { getUser } from '../../../common/getters';

export const meta = {
	tags: ['following', 'account'],

	requireCredential: true as const,

	kind: 'write:following',

	params: {
		userId: {
			validator: $.type(ID),
		}
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '66ce1645-d66c-46bb-8b79-96739af885bd'
		},
		noFollowRequest: {
			message: 'No follow request.',
			code: 'NO_FOLLOW_REQUEST',
			id: 'bcde4f8b-0913-4614-8881-614e522fb041'
		},
	}
};

export default define(meta, async (ps, user) => {
	// Fetch follower
	const follower = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
		throw e;
	});

	await acceptFollowRequest(user, follower).catch(e => {
		if (e.id === '8884c2dd-5795-4ac9-b27e-6a01d38190f9') throw new ApiError(meta.errors.noFollowRequest);
		throw e;
	});

	return;
});
