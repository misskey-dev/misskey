import $ from 'cafy'; import ID from '../../../../cafy-id';
import Following from '../../../../models/following';

/**
 * Unstalk a user
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	const follower = user;

	// Get 'userId' parameter
	const [userId, userIdErr] = $.type(ID).get(params.userId);
	if (userIdErr) return rej('invalid userId param');

	// Fetch following
	const following = await Following.findOne({
		followerId: follower._id,
		followeeId: userId
	});

	if (following === null) {
		return rej('following not found');
	}

	// Stalk
	await Following.update({ _id: following._id }, {
		$set: {
			stalk: false
		}
	});

	// Send response
	res();

	// TODO: イベント
});
