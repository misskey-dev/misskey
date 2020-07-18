import $ from 'cafy';
import define from '../../../define';
import deleteFollowing from '../../../../../services/following/delete';
import { Followings, Users } from '../../../../../models';
import { ensure } from '../../../../../prelude/ensure';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		host: {
			validator: $.str
		}
	}
};

export default define(meta, async (ps, me) => {
	const followings = await Followings.find({
		followerHost: ps.host
	});

	const pairs = await Promise.all(followings.map(f => Promise.all([
		Users.findOne(f.followerId).then(ensure),
		Users.findOne(f.followeeId).then(ensure)
	])));

	for (const pair of pairs) {
		deleteFollowing(pair[0], pair[1]);
	}
});
