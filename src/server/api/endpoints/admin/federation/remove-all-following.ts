import $ from 'cafy';
import define from '../../../define';
import Following from '../../../../../models/following';
import User from '../../../../../models/user';
import deleteFollowing from '../../../../../services/following/delete';

export const meta = {
	requireCredential: true,
	requireModerator: true,

	params: {
		host: {
			validator: $.str
		}
	}
};

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
	const followings = await Following.find({
		'_follower.host': ps.host
	});

	const pairs = await Promise.all(followings.map(f => Promise.all([
		User.findOne({ _id: f.followerId }),
		User.findOne({ _id: f.followeeId })
	])));

	for (const pair of pairs) {
		deleteFollowing(pair[0], pair[1]);
	}

	res();
}));
