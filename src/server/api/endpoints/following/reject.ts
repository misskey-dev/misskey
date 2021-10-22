import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import { rejectFollow } from '@/services/following/reject';
import define from '../../define';
import { ApiError } from '../../error';
import { getUser } from '../../common/getters';

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
			id: 'bbe2f6e5-d28b-4b0e-997b-d2ad04a5ec3a'
		},
	}
};

export default define(meta, async (ps, user) => {
	// Fetch follower
	const follower = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
		throw e;
	});

	await rejectFollow(user, follower);

	return;
});
