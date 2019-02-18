import User from '../../../../models/user';
import define from '../../define';

export const meta = {
	requireCredential: true,

	kind: 'account-write',

	params: {
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	await User.update({ _id: user._id }, {
		$set: {
			pendingReceivedFollowRequestsCount: 0
		}
	});

	res();
}));
