import define from '../../define';
import { Users } from '../../../../models';

export const meta = {
	tags: ['account', 'following'],

	requireCredential: true,

	kind: 'account-write',

	params: {
	}
};

export default define(meta, async (ps, user) => {
	await Users.update(user.id, {
		pendingReceivedFollowRequestsCount: 0
	});
});
