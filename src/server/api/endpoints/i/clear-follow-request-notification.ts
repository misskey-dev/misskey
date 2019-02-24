import User from '../../../../models/user';
import define from '../../define';

export const meta = {
	tags: ['account', 'following'],

	requireCredential: true,

	kind: 'account-write',

	params: {
	}
};

export default define(meta, async (ps, user) => {
	await User.update({ _id: user._id }, {
		$set: {
			pendingReceivedFollowRequestsCount: 0
		}
	});

	return;
});
